import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User, Post, Comment, JsonModel, Keystroke
from privatemessages.models import Thread, Message
from importlib import import_module
from django.core.cache import cache

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async, async_to_sync
from channels.db import database_sync_to_async

import datetime
import uuid
import base64, io, os, re
session_engine = import_module(settings.SESSION_ENGINE)

from redis_om import get_redis_connection
redis = get_redis_connection()


@sync_to_async
def autocomplete_query_redis(prefix):
    results = []
    rangelen = 50 
    count=6
    start = redis.zrank('compl', prefix)    
    if not start:
        results = []
    while (len(results) != count):
        try:         
            range = redis.zrange('compl', start, start+rangelen-1)         
            start += rangelen
            if not range or len(range) == 0:
                break
            for entry in range:
                #print (entry)
                #entry = entry.decode('utf-8')
                minlen = min(len(entry),len(prefix))   
                if entry[0:minlen] != prefix[0:minlen]:    
                    count = len(results)
                    break              
                if entry[-1] == "*" and len(results) != count:                 
                    results.append(entry[0:-1])
        except TypeError:
            break
    return results

@sync_to_async
def search_query_redis(prefix):
    #args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%'+results[0]+'%', 'LIMIT', '0', '5']
    args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', f'@username_fts:{prefix}', 'LIMIT', '0', '5']
    raw_results = redis.execute_command(*args)
    results = JsonModel.from_redis(raw_results)
    if len(results) > 0:
        results = [i.json() for i in results]
        return results
    else:
        args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%'+prefix+'%', 'LIMIT', '0', '50']
        raw_results = redis.execute_command(*args)
        results = JsonModel.from_redis(raw_results)
        if len(results) > 0:
            results = [i.json() for i in results]
            print (results)
            return results
        else:
            args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:'+prefix+'*', 'LIMIT', '0', '50']
            raw_results = redis.execute_command(*args)
            results = JsonModel.from_redis(raw_results) 
            if len(results) > 0:          
                results = [i.json() for i in results]
                return results    
            else:
                results = User.objects.filter(username=prefix)
                results = [json.dumps({"pk": str(i.pk), "path_data": i.path_data, "username": i.username, "image_user": i.image_user}) for i in results]
                return results  
 
from redis import StrictRedis
            
@sync_to_async
def delete_pm(pk, sender_id):
    r = StrictRedis()
    t = Thread.objects.get(id=pk)
    pm = Message.objects.filter(thread=pk).all()
    partner = t.participants.exclude(id=sender_id)[0]
    r.hdel('%s_notifications' % sender_id, pk.encode())
    r.hdel('%s_notifications' % partner.id, pk.encode())
    pm.delete()
    t.delete()
##    t.entry_set.clear()   

@sync_to_async
def delete_com(pk):
    t = Comment.objects.get(id=pk)
    t.delete()
    
@sync_to_async
def delete_post(pk, sender_id):
    post = Post.objects.get(id=pk)
    if sender_id == post.user_post.id:
#         ERROR
        if post.image != "":
            os.system(f"rm -rf media/data_image/{post.path_data}/{post.image}")
        post.delete()
        _data = {"type": "wallpost", "status":"deletepost", "post_id":pk}
    else:
        _data = {"type": "wallpost", "status":"deletepost_error", "post_id":pk}
    return _data



@sync_to_async
def add_keystroke(user, json_data):
    T = json_data["body"].replace('\xa0', ' ').replace("\n\n", " ").replace("\n", " ").lower()
    post = Keystroke()
    post.pure_data = json_data["arr_keypress"]
    post.status = "y"
    post.text = T
    post.user_post_key = user
    post.os_info = json_data["os_info"]
    post.save()
    


class WallHandler(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "wall"
        self.sender_id = self.scope['user'].id
        self.sender_name = self.scope['user']
        if str(self.scope['user']) != 'AnonymousUser':
            self.image_user = self.scope['user'].image_user
            self.path_data = self.scope['user'].path_data
            self.namefile = str()
        print ("CACHES----->", cache.get('seen_%s' % self.sender_id)) 
        cache.set('channel_%s' % (self.sender_id), self.channel_name) 
        
         
        print ("CHANNEL_LAYERS", self.channel_name, self.room_group_name, self.scope['user'])
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        print("Disconnected", close_code)
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    async def receive(self, text_data):
        """
        Receive message from WebSocket.
        Get the event and send the appropriate event
        """
        
        response = json.loads(text_data)
        event = response.get("event", None)
        if self.scope['user'].is_authenticated:  
            if event == "comment_post":
                if response['comment_image'] != "":
                    nameFile = str(uuid.uuid4())[:12]
                    imgstr = re.search(r'base64,(.*)', response['comment_image']).group(1)
                    img_file = open(f"media/data_image/{self.path_data}/{nameFile}.png", 'wb')
                    img_file.write(base64.b64decode(imgstr))
                    img_file.close()
                    comment_image = f"{self.path_data}/{nameFile}.png"
                else:
                    comment_image = ""
                    nameFile = ""
                ps = await database_sync_to_async(Post.objects.get)(id=response["post_id"])
                comment = Comment()
                comment.comment_text = response["comment_text"]
                comment.comment_image = nameFile
                comment.post_id = ps
                comment.comment_user = self.sender_name
                comment_async = sync_to_async(comment.save)
                await comment_async()    
                now = datetime.datetime.now().strftime('%H:%M:%S')
                _data={
                        "type": "wallpost",
                        "comment_text": response["comment_text"],
                        "comment_image": comment_image,
                        "comment_user": self.scope['user'].username,
                        "comment_id":str(comment.id),
                        "path_data": self.path_data,
                        "image_user": self.image_user,
                        "post_id": response["post_id"],
                        "user_id": str(self.sender_id),
                        "timecomment":now,
                        "status" : "send_comment"
                    }
                await self.channel_layer.group_send(self.room_group_name, _data)
                
            if event == "wallpost":
                #print (response["all_time_sec"])
                if response["image"] == False:
                    self.namefile = ""
                user_postv = await database_sync_to_async(User.objects.get)(id=self.sender_id)
                post = Post()
                post.title = response["title"]
                post.body = response["body"]
                post.image = self.namefile
                post.path_data = self.path_data
                post.user_post = user_postv
                post_async = sync_to_async(post.save)
                await post_async()
                
                await add_keystroke(user_postv, response)
                
                _data = {"type": "wallpost",
                         "timestamp": dateformat.format(post.date_post, 'U'),
                         "image": self.namefile,
                         "text":response["body"],
                         "user_post": str(self.sender_name),
                         "user_id": str(self.sender_id),
                         "id": str(post.id),
                         "image_user" : self.image_user, 
                         "path_data" : self.path_data,
                         "status" : "wallpost"
                        }
                if self.namefile == "":
                    _temp_dict = {}
                    _temp_dict["title"] = response["title"]
                    _temp_dict["path_data"] = self.path_data
                    _temp_dict["post"] = str(post.id)
                    _temp_dict["type"] = "triggerWorker"
                    _temp_dict["room_group_name"] = self.room_group_name
                    await self.channel_layer.send('nnapp', _temp_dict)
                    
                    # Старая версия работы
#                        await self.send_and_get(_temp_dict, model='Kandinsky-2.0')
#                        t = threading.Thread(target=self.send_and_get, 
#                                             args=[_temp_dict], 
#                                             kwargs={"model":"Kandinsky-2.0"})
#                        t.start()
#                        t.join() 
                #----------------------------------------->   
                await self.channel_layer.group_send(self.room_group_name, _data)
                
            if event == "Start":
                self.namefile = f'{str(uuid.uuid4())[:12]}_{response["Name"]}'
                self.myfile = open(f'media/data_image/{self.path_data}/{self.namefile}', "wb")
                _data = {"type": "wallpost", "status":"MoreData"}
                #await self.channel_layer.group_send(self.room_group_name, _data)
                await self.channel_layer.send(self.channel_name, _data)   

            if event == "Upload":
                da = response["Data"]
                da = da.split(",")[1]
                file_bytes = io.BytesIO(base64.b64decode(da)).read()
                self.myfile.write(file_bytes)
                _data = {"type": "wallpost", "status":"MoreData"}
                #await self.channel_layer.group_send(self.room_group_name, _data)
                await self.channel_layer.send(self.channel_name, _data) 
                
            if event == "Done":
                _data = {"type": "wallpost", "status":"Done"}
                #await self.channel_layer.group_send(self.room_group_name, _data)
                await self.channel_layer.send(self.channel_name, _data) 

            
            if event == "deletepost":
                _data = await delete_post(response["id"], self.sender_id)
#                await sync_to_async(post.delete)()
#                _data = {"type": "wallpost", "status":"deletepost", "post_id":response["id"]}
#                await self.channel_layer.send(self.channel_name, _data) 
                await self.channel_layer.group_send(self.room_group_name, _data)
                
            if event == "autocomplete":
                answer_search = await autocomplete_query_redis(response["data"])
                #print (answer_search)
                await self.channel_layer.send(self.channel_name,
                                                {
                                                    "type":"wallpost",
                                                    "status" : "autocomplete",
                                                    "answer_autocomplete":answer_search
                                                }
                                             ) 
            if event == "search":
                answer_search = await search_query_redis(response["data"])
                #print (answer_search)
                await self.channel_layer.send(self.channel_name,
                                                {
                                                    "type":"wallpost",
                                                    "status" : "search",
                                                    "answer_search":answer_search
                                                }
                                             ) 
            if event == "delete_pm":
                if response["data"]["request_user"] == str(self.sender_name):
                    answer_delete = await delete_pm(response["data"]["thread_id"], self.sender_id)
                    await self.channel_layer.send(self.channel_name,
                                                    {
                                                        "type":"wallpost",
                                                        "status" : "delete_pm",
                                                        "thread_id": response["data"]["thread_id"]
                                                    }
                                                 )                 
            if event == "delete_com":
                print (response)
                if response["data"]["request_user"] == str(self.sender_name):
                    answer_delete = await delete_com(response["data"]["comment_id"])
                    #await self.channel_layer.send(self.channel_name,
                    await self.channel_layer.group_send(self.room_group_name,
                                                    {
                                                        "type":"wallpost",
                                                        "status" : "delete_com",
                                                        "comment_id": response["data"]["comment_id"]
                                                    }
                                                 )  

            
        else:
            await self.channel_layer.group_send(self.room_group_name, {"type": "wallpost"})           

    async def wallpost(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        print ("WALLPOST", res)
        await self.send(text_data=json.dumps(res))



