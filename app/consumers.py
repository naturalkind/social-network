# consumers.py
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User, Post, Comment, JsonModel, Keystroke
from privatemessages.models import Thread, Message
from importlib import import_module
from django.core.cache import cache
from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.shortcuts import get_object_or_404
from django.core import serializers
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from redis.asyncio import Redis
from api.serializers import PostSerializer

import datetime
import uuid
import base64
import io
import os
import re
import asyncio

session_engine = import_module(settings.SESSION_ENGINE)
from redis_om import get_redis_connection
redis_sync = get_redis_connection()  # для синхронных операций

# ---------- Утилиты ----------
def convert_uuids(obj):
    """Рекурсивное преобразование UUID в строку"""
    if isinstance(obj, uuid.UUID):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: convert_uuids(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [convert_uuids(i) for i in obj]
    return obj

@sync_to_async
def serialize_post(post):
    serializer = PostSerializer(instance=post)
    return serializer.data

# ---------- Redis операции ----------
@sync_to_async
def autocomplete_query_redis(prefix):
    results = []
    rangelen = 50 
    count = 6
    start = redis_sync.zrank('compl', prefix)    
    if not start:
        results = []
    while len(results) != count:
        try:         
            range_items = redis_sync.zrange('compl', start, start + rangelen - 1)         
            start += rangelen
            if not range_items or len(range_items) == 0:
                break
            for entry in range_items:
                entry = entry.decode('utf-8') if isinstance(entry, bytes) else entry
                minlen = min(len(entry), len(prefix))   
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
    args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', f'@username_fts:{prefix}', 'LIMIT', '0', '5']
    raw_results = redis_sync.execute_command(*args)
    results = JsonModel.from_redis(raw_results)
    if len(results) > 0:
        results = [i.json() for i in results]
        return results
    else:
        args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%'+prefix+'%', 'LIMIT', '0', '50']
        raw_results = redis_sync.execute_command(*args)
        results = JsonModel.from_redis(raw_results)
        if len(results) > 0:
            results = [i.json() for i in results]
            return results
        else:
            args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:'+prefix+'*', 'LIMIT', '0', '50']
            raw_results = redis_sync.execute_command(*args)
            results = JsonModel.from_redis(raw_results) 
            if len(results) > 0:          
                results = [i.json() for i in results]
                return results    
            else:
                results = User.objects.filter(username=prefix)
                results = [json.dumps({"pk": str(i.pk), "path_data": i.path_data, "username": i.username, "image_user": i.image_user}) for i in results]
                return results  

# ---------- Операции с БД ----------
@sync_to_async
def delete_pm(pk, sender_id):
    from redis import StrictRedis
    r = StrictRedis()
    t = Thread.objects.get(id=pk)
    pm = Message.objects.filter(thread=pk).all()
    partner = t.participants.exclude(id=sender_id)[0]
    r.hdel('%s_notifications' % sender_id, pk.encode())
    r.hdel('%s_notifications' % partner.id, pk.encode())
    pm.delete()
    t.delete()

@sync_to_async
def delete_com(pk):
    t = Comment.objects.get(id=pk)
    t.delete()

@sync_to_async
def delete_post(pk, sender_id):
    post = Post.objects.get(id=pk)
    if sender_id == post.user_post.id:
        if post.image != "":
            os.system(f"rm -rf media/data_image/{post.path_data}/{post.image}")
        post.delete()
        return {"type": "wallpost", "status": "deletepost", "post_id": pk}
    return {"type": "wallpost", "status": "deletepost_error", "post_id": pk}

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

# ---------- Операции для приватных сообщений ----------
@sync_to_async
def get_pages(room_name, sender_id, message_res):
    thread = get_object_or_404(Thread, id=room_name, participants__id=sender_id)
    messages = thread.message_set.order_by("-datetime")
    paginator = Paginator(messages, 40)
    data = {
        "type": "send_message",  # Важно: это поле type для channel_layer
        "event": "loadmore",
        "all_pages": paginator.num_pages,
        "thread_id": room_name,
        "op1": None,
        "data": None
    }
    try:
        posts = paginator.page(message_res)
        data["op1"] = str(paginator.page(message_res).next_page_number())
        data["data"] = serializers.serialize(
            "json",
            posts,
            use_natural_foreign_keys=True,
            use_natural_primary_keys=True
        )
    except PageNotAnInteger:
        posts = paginator.page(1)
        data["op1"] = "2" if paginator.num_pages > 1 else "STOP"
        data["data"] = serializers.serialize(
            "json",
            posts,
            use_natural_foreign_keys=True,
            use_natural_primary_keys=True
        )
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
        data["op1"] = "STOP"
        data["data"] = serializers.serialize(
            "json",
            posts,
            use_natural_foreign_keys=True,
            use_natural_primary_keys=True
        )

    return data

@sync_to_async
def get_partner(room_name, sender_id):
    thread = get_object_or_404(Thread, id=room_name, participants__id=sender_id)
    return thread.participants.exclude(id=sender_id)[0]

# Синхронная функция для уведомлений
def add_notification(user_id, notification_id, data):
    from redis import StrictRedis
    r = StrictRedis(host='localhost', port=6379, decode_responses=True)
    r.hset(f'{user_id}_notifications', notification_id, json.dumps(data))

# ---------- Основной Consumer ----------
class SocialConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Определяем тип комнаты из URL
        self.room_type = self.scope['url_route']['kwargs'].get('room_type', 'wall')
        self.room_code = self.scope['url_route']['kwargs'].get('room_code', "")
        if self.room_code:
            self.room_type = 'thread'
        
        # Для thread комнат получаем room_code
        if self.room_type == 'thread':
            self.room_name = self.scope['url_route']['kwargs']['room_code']
            self.room_group_name = f"thread_{self.room_name}_messages"
        else:  # wall
            self.room_name = None
            self.room_group_name = "wall"
            
        self.sender_id = self.scope['user'].id if self.scope['user'].is_authenticated else None
        self.sender_name = self.scope['user']
        
        # Переменные для загрузки файлов (стена)
        self.uploaded_filename = ""
        self.myfile = None
        
        # Переменные для загрузки файлов (чат)
        self.chat_upload_temp_file = None
        self.chat_upload_filename = None
        self.chat_upload_filepath = None
        self.chat_upload_temp_message = None
        self.chat_upload_thread_id = None
        
        if self.scope['user'].is_authenticated:
            self.image_user = self.scope['user'].image_user
            self.path_data = self.scope['user'].path_data

        print(f"Connected: {self.room_type}, channel: {self.channel_name}, user: {self.scope['user']}")
        
        if self.sender_id:
            cache.set(f'channel_{self.sender_id}', self.channel_name)
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Для thread комнат создаем асинхронный Redis клиент
        if self.room_type == 'thread':
            self.redis = Redis.from_url("redis://localhost")
            
        await self.accept()

    async def disconnect(self, close_code):
        print(f"Disconnected: {self.room_type}, code: {close_code}")
        
        # Закрываем открытые файлы
        if hasattr(self, 'myfile') and self.myfile:
            self.myfile.close()
        
        if hasattr(self, 'chat_upload_temp_file') and self.chat_upload_temp_file:
            self.chat_upload_temp_file.close()
        
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        if hasattr(self, 'redis'):
            await self.redis.close()

    async def receive(self, text_data):
        """Обработка входящих сообщений от клиента"""
        try:
            response = json.loads(text_data)
        except json.JSONDecodeError:
            print("Invalid JSON received")
            return
            
        event = response.get("event", None)

        if not self.scope['user'].is_authenticated:
            await self.send(text_data=json.dumps({
                "event": "error",
                "status": "unauthorized",
                "message": "Authentication required"
            }))
            return

        # ---------- Обработка событий стены ----------
        if event == "comment_post":
            await self.handle_comment_post(response)
            
        elif event == "wallpost":
            await self.handle_wallpost(response)
            
        elif event == "Start":
            await self.handle_upload_start(response)
            
        elif event == "Upload":
            await self.handle_upload_chunk(response)
            
        elif event == "Done":
            await self.handle_upload_done()
            
        elif event == "deletepost":
            await self.handle_delete_post(response)
            
        elif event == "autocomplete":
            await self.handle_autocomplete(response)
            
        elif event == "search":
            await self.handle_search(response)
            
        elif event == "delete_com":
            await self.handle_delete_comment(response)
            
        # ---------- Обработка событий чата ----------
        elif event == "chat_upload_start":
            await self.handle_chat_upload_start(response)
            
        elif event == "chat_upload_chunk":
            await self.handle_chat_upload_chunk(response)
            
        elif event == "chat_upload_progress":
            await self.handle_chat_upload_progress(response)
            
        elif event == "chat_upload_done":
            await self.handle_chat_upload_done(response)
            
        elif event == "privatemessages":
            await self.handle_private_message(response)
            
        elif event == "loadmore":
            await self.handle_load_more(response)
            
        elif event == "delete_pm":
            await self.handle_delete_pm(response)
            
        # ---------- Дополнительные события ----------
        elif event == "keystroke":
            await self.handle_keystroke(response)
            
        else:
            await self.send(text_data=json.dumps({
                "event": "error",
                "status": "unknown_event",
                "message": f"Unknown event: {event}"
            }))

    # ---------- Обработчики для стены ----------
    async def handle_comment_post(self, response):
        """Обработка комментария"""
        try:
            if response.get('comment_image'):
                nameFile = str(uuid.uuid4())[:12]
                imgstr = re.search(r'base64,(.*)', response['comment_image']).group(1)
                
                # Создаем директорию если её нет
                os.makedirs(f"media/data_image/{self.path_data}", exist_ok=True)
                
                with open(f"media/data_image/{self.path_data}/{nameFile}.png", 'wb') as img_file:
                    img_file.write(base64.b64decode(imgstr))
                
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
            await sync_to_async(comment.save)()
            
            now = datetime.datetime.now().strftime('%H:%M:%S')
            _data = {
                "type": "wallpost",  # Важно: это поле type для channel_layer
                "status": "send_comment",
                "comment_text": response["comment_text"],
                "comment_image": comment_image,
                "comment_user": self.scope['user'].username,
                "comment_id": str(comment.id),
                "path_data": self.path_data,
                "image_user": self.image_user,
                "post_id": response["post_id"],
                "user_id": str(self.sender_id),
                "timecomment": now
            }
            print ("================+>", _data)
            await self.channel_layer.group_send(self.room_group_name, _data)
            
        except Exception as e:
            print(f"Error in handle_comment_post: {e}")
            await self.send(text_data=json.dumps({
                "event": "error",
                "status": "comment_error",
                "message": str(e)
            }))

    async def handle_wallpost(self, response):
        """Обработка нового поста"""
        print ("HANDLE_WALLPOST !!!!!!!", response, self.uploaded_filename, self.path_data)
        try:
            user_postv = await database_sync_to_async(User.objects.get)(id=self.sender_id)

            if self.uploaded_filename:
                image_name = self.uploaded_filename
                self.uploaded_filename = ""
            else:
                image_data = response.get("image")
                if image_data and image_data not in (False, "false", ""):
                    match = re.search(r'base64,(.*)', image_data)
                    if match:
                        image_name = str(uuid.uuid4())[:12] + ".png"
                        img_bytes = base64.b64decode(match.group(1))
                        
                        # Создаем директорию если её нет
                        os.makedirs(f"media/data_image/{self.path_data}", exist_ok=True)
                        
                        file_path = f"media/data_image/{self.path_data}/{image_name}"
                        with open(file_path, 'wb') as f:
                            f.write(img_bytes)
                    else:
                        image_name = ""
                else:
                    image_name = ""

            post = Post()
            post.title = response.get("title", "")
            post.body = response.get("body", "")
            post.image = image_name #.split('.')[0] if '.' in image_name else image_name
            post.path_data = self.path_data
            post.user_post = user_postv
            await sync_to_async(post.save)()

            serialized_data = await serialize_post(post)
            serialized_data = convert_uuids(serialized_data)

            _data = {
                "type": "wallpost",  # Важно: это поле type для channel_layer
                "status": "wallpost",
                **serialized_data
            }

            await self.channel_layer.group_send(self.room_group_name, _data)
            
        except Exception as e:
            print(f"Error in handle_wallpost: {e}")
            await self.send(text_data=json.dumps({
                "event": "error",
                "status": "post_error",
                "message": str(e)
            }))

    async def handle_upload_start(self, response):
        """Начало загрузки файла (стена)"""
        try:
            self.uploaded_filename = f'{str(uuid.uuid4())[:12]}_{response["Name"]}'
            
            # Создаем директорию если её нет
            os.makedirs(f'media/data_image/{self.path_data}', exist_ok=True)
            
            self.myfile = open(f'media/data_image/{self.path_data}/{self.uploaded_filename}', "wb")
            
            await self.send(text_data=json.dumps({
                "event": "more_data",  # Изменено с "type" на "event" для клиента
                "status": "MoreData"
            }))
        except Exception as e:
            print(f"Error in handle_upload_start: {e}")
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "status": "upload_error",
                "message": str(e)
            }))

    async def handle_upload_chunk(self, response):
        """Загрузка части файла (стена)"""
        try:
            da = response["Data"]
            if ',' in da:
                da = da.split(',')[1]
            file_bytes = base64.b64decode(da)
            self.myfile.write(file_bytes)
            
            await self.send(text_data=json.dumps({
                "event": "more_data",  # Изменено с "type" на "event" для клиента
                "status": "MoreData"
            }))
        except Exception as e:
            print(f"Error in handle_upload_chunk: {e}")
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "status": "upload_error",
                "message": str(e)
            }))

    async def handle_upload_done(self):
        """Завершение загрузки файла (стена)"""
        try:
            self.myfile.close()
            self.myfile = None
            
            await self.send(text_data=json.dumps({
                "event": "done",  # Изменено с "type" на "event" для клиента
                "status": "Done"
            }))
        except Exception as e:
            print(f"Error in handle_upload_done: {e}")
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "status": "upload_error",
                "message": str(e)
            }))

    async def handle_delete_post(self, response):
        """Удаление поста"""
        try:
            _data = await delete_post(response["id"], self.sender_id)
            await self.channel_layer.group_send(self.room_group_name, _data)
        except Exception as e:
            print(f"Error in handle_delete_post: {e}")

    async def handle_autocomplete(self, response):
        """Автодополнение поиска"""
        try:
            answer_search = await autocomplete_query_redis(response["data"])
            await self.send(text_data=json.dumps({
                "event": "autocomplete",  # Изменено с "type" на "event" для клиента
                "status": "autocomplete",
                "answer_autocomplete": answer_search
            }))
        except Exception as e:
            print(f"Error in handle_autocomplete: {e}")

    async def handle_search(self, response):
        """Поиск пользователей"""
        try:
            answer_search = await search_query_redis(response["data"])
            await self.send(text_data=json.dumps({
                "event": "search",  # Изменено с "type" на "event" для клиента
                "status": "search",
                "answer_search": answer_search
            }))
        except Exception as e:
            print(f"Error in handle_search: {e}")

    async def handle_delete_comment(self, response):
        """Удаление комментария"""
        try:
            if response["data"]["request_user"] == str(self.sender_name):
                await delete_com(response["data"]["comment_id"])
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "wallpost",  # Важно: это поле type для channel_layer
                    "status": "delete_com",
                    "comment_id": response["data"]["comment_id"]
                })
        except Exception as e:
            print(f"Error in handle_delete_comment: {e}")

    async def handle_keystroke(self, response):
        """Обработка нажатий клавиш (для аналитики)"""
        try:
            await add_keystroke(self.sender_name, response)
        except Exception as e:
            print(f"Error in handle_keystroke: {e}")

    # ---------- Обработчики для чата ----------
    async def handle_chat_upload_start(self, response):
        """Начало загрузки файла в чате"""
        try:
            self.chat_upload_filename = f'{str(uuid.uuid4())[:12]}_{response["name"]}'
            self.chat_upload_filepath = f'media/data_image/{self.path_data}/{self.chat_upload_filename}'
            self.chat_upload_temp_message = response.get('temp_id')
            self.chat_upload_thread_id = response.get('thread_id')
            
            # Создаем директорию если её нет
            os.makedirs(os.path.dirname(self.chat_upload_filepath), exist_ok=True)
            self.chat_upload_temp_file = open(self.chat_upload_filepath, 'wb')
            
            # Отправляем подтверждение
            await self.send(text_data=json.dumps({
                "event": "more_data",  # Изменено для клиента
                "temp_id": self.chat_upload_temp_message
            }))
            
        except Exception as e:
            print(f"Error in handle_chat_upload_start: {e}")
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "error": str(e),
                "temp_id": response.get('temp_id')
            }))

    async def handle_chat_upload_chunk(self, response):
        """Получение части файла в чате"""
        if not hasattr(self, 'chat_upload_temp_file') or not self.chat_upload_temp_file:
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "error": "Upload session not started",
                "temp_id": response.get('temp_id')
            }))
            return
        
        try:
            chunk_data = response.get("data")
            if ',' in chunk_data:
                chunk_data = chunk_data.split(',')[1]
            
            file_bytes = base64.b64decode(chunk_data)
            self.chat_upload_temp_file.write(file_bytes)
            
            # Отправляем подтверждение
            await self.send(text_data=json.dumps({
                "event": "more_data",  # Изменено для клиента
                "temp_id": self.chat_upload_temp_message,
                "received": len(file_bytes)
            }))
            
        except Exception as e:
            print(f"Error in handle_chat_upload_chunk: {e}")
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "error": str(e),
                "temp_id": response.get('temp_id')
            }))

    async def handle_chat_upload_progress(self, response):
        """Обновление прогресса загрузки (пробрасываем клиенту)"""
        try:
            await self.send(text_data=json.dumps({
                "event": "upload_progress",  # Изменено для клиента
                "progress": response.get("progress"),
                "temp_id": response.get("temp_id")
            }))
        except Exception as e:
            print(f"Error in handle_chat_upload_progress: {e}")

    async def handle_chat_upload_done(self, response):
        """Завершение загрузки файла и отправка сообщения"""
        if not hasattr(self, 'chat_upload_temp_file') or not self.chat_upload_temp_file:
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "error": "Upload session not started",
                "temp_id": response.get("temp_id")
            }))
            return
        
        try:
            # Закрываем файл
            self.chat_upload_temp_file.close()
            
            message_text = response.get("text", "")
            temp_id = response.get("temp_id")
            thread_id = response.get("thread_id") or self.room_name
            
            # Создаем сообщение с изображением
            message = await self.create_message_with_image(
                thread_id=thread_id,
                text=message_text,
                filename=self.chat_upload_filename,
                path_data=self.path_data
            )
            
            # Получаем информацию о партнере для уведомления
            try:
                partner = await get_partner(thread_id, self.sender_id)
            except:
                partner = None
            
            # Данные для отправки в группу
            message_data = {
                "type": "send_message",  # Важно: это поле type для channel_layer
                "event": "privatemessages",
                "message_id": str(message.id),
                "timestamp": dateformat.format(message.datetime, 'U'),
                "sender": str(self.sender_name),
                "sender_id": str(self.sender_id),
                "image_user": self.image_user,
                "path_data": self.path_data,
                "message": message_text,
                "pm_image": self.chat_upload_filename.split('.')[0],
                "thread_id": thread_id,
                "temp_id": temp_id
            }
            
            # Отправляем сообщение в группу
            await self.channel_layer.group_send(
                f"thread_{thread_id}_messages",
                message_data
            )
            
            # Отправляем подтверждение о завершении загрузки клиенту
            await self.send(text_data=json.dumps({
                "event": "upload_complete",  # Изменено для клиента
                "message_id": str(message.id),
                "pm_image": self.chat_upload_filename.split('.')[0],
                "path_data": self.path_data,
                "temp_id": temp_id,
                "progress": 100
            }))
            
            # Уведомление партнера
            if partner:
                add_notification(partner.id, thread_id, {"read": False})
                partner_channel = cache.get(f'channel_{partner.id}')
                if partner_channel:
                    await self.channel_layer.send(partner_channel, {
                        "type": "wallpost",  # Важно: это поле type для channel_layer
                        "status": "notification",
                        "sender_id": self.sender_id,
                        "thread_id": thread_id,
                        "sender": str(self.sender_name)
                    })
            
            # Очищаем временные данные
            self.chat_upload_temp_file = None
            self.chat_upload_filename = None
            self.chat_upload_filepath = None
            self.chat_upload_temp_message = None
            self.chat_upload_thread_id = None
            
        except Exception as e:
            print(f"Error in handle_chat_upload_done: {e}")
            await self.send(text_data=json.dumps({
                "event": "upload_error",
                "error": str(e),
                "temp_id": response.get("temp_id")
            }))

    @database_sync_to_async
    def create_message_with_image(self, thread_id, text, filename, path_data):
        """Создание сообщения с изображением в базе данных"""
        try:
            thread = Thread.objects.get(id=thread_id)
            
            # Проверяем, что пользователь является участником треда
            if not thread.participants.filter(id=self.sender_id).exists():
                raise Exception("User is not a participant of this thread")
            
            message = Message.objects.create(
                thread=thread,
                sender=self.scope['user'],
                text=text,
                pm_image=filename.split('.')[0]
            )
            
            # Обновляем счетчики в Redis
            try:
                from redis import StrictRedis
                r = StrictRedis(host='localhost', port=6379, decode_responses=True)
                r.hincrby(f"private_{thread_id}_messages", "total_messages", 1)
                r.hincrby(f"private_{thread_id}_messages", f"from_{self.sender_id}", 1)
            except Exception as e:
                print(f"Redis error in create_message_with_image: {e}")
            
            return message
            
        except Thread.DoesNotExist:
            raise Exception("Thread not found")
        except Exception as e:
            raise Exception(f"Error creating message: {str(e)}")

    async def handle_private_message(self, response):
        """Отправка приватного сообщения (без изображения)"""
        try:
            message_text = response.get("message")
            thread_id = response.get("thread_id") or self.room_name
            
            if not thread_id:
                await self.send(text_data=json.dumps({
                    "event": "error",
                    "error": "Thread ID is required"
                }))
                return
            
            # Создаем сообщение в БД
            message = await self.create_text_message(thread_id, message_text)
            
            # Получаем информацию о партнере
            try:
                partner = await get_partner(thread_id, self.sender_id)
            except:
                partner = None
            
            _data = {
                "type": "send_message",  # Важно: это поле type для channel_layer
                "event": "privatemessages",
                "message_id": str(message.id),
                "timestamp": dateformat.format(message.datetime, 'U'),
                "sender": str(self.sender_name),
                "sender_id": str(self.sender_id),
                "image_user": self.image_user,
                "path_data": self.path_data,
                "message": message_text,
                "pm_image": "",
                "thread_id": thread_id
            }
            
            await self.channel_layer.group_send(
                f"thread_{thread_id}_messages",
                _data
            )
            
            # Уведомление партнера
            if partner:
                add_notification(partner.id, thread_id, {"read": False})
                partner_channel = cache.get(f'channel_{partner.id}')
                if partner_channel:
                    await self.channel_layer.send(partner_channel, {
                        "type": "wallpost",  # Важно: это поле type для channel_layer
                        "status": "notification",
                        "sender_id": self.sender_id,
                        "thread_id": thread_id,
                        "sender": str(self.sender_name)
                    })
                    
        except Exception as e:
            print(f"Error in handle_private_message: {e}")
            await self.send(text_data=json.dumps({
                "event": "error",
                "error": str(e)
            }))

    @database_sync_to_async
    def create_text_message(self, thread_id, text):
        """Создание текстового сообщения в базе данных"""
        try:
            thread = Thread.objects.get(id=thread_id)
            
            # Проверяем, что пользователь является участником треда
            if not thread.participants.filter(id=self.sender_id).exists():
                raise Exception("User is not a participant of this thread")
            
            message = Message.objects.create(
                thread=thread,
                sender=self.scope['user'],
                text=text
            )
            
            # Обновляем счетчики в Redis
            try:
                from redis import StrictRedis
                r = StrictRedis(host='localhost', port=6379, decode_responses=True)
                r.hincrby(f"private_{thread_id}_messages", "total_messages", 1)
                r.hincrby(f"private_{thread_id}_messages", f"from_{self.sender_id}", 1)
            except Exception as e:
                print(f"Redis error in create_text_message: {e}")
            
            return message
            
        except Thread.DoesNotExist:
            raise Exception("Thread not found")
        except Exception as e:
            raise Exception(f"Error creating message: {str(e)}")

    async def handle_load_more(self, response):
        """Загрузка следующих сообщений"""
        try:
            message_res = response.get("message")
            _data = await get_pages(self.room_name, self.sender_id, message_res)
            await self.channel_layer.group_send(self.room_group_name, _data)
        except Exception as e:
            print(f"Error in handle_load_more: {e}")

    async def handle_delete_pm(self, response):
        """Удаление переписки"""
        try:
            if response["data"]["request_user"] == str(self.sender_name):
                await delete_pm(response["data"]["thread_id"], self.sender_id)
                await self.send(text_data=json.dumps({
                    "event": "delete_pm",  # Изменено для клиента
                    "status": "delete_pm",
                    "thread_id": response["data"]["thread_id"]
                }))
        except Exception as e:
            print(f"Error in handle_delete_pm: {e}")

    # ---------- Методы для отправки клиенту (вызываются через channel_layer) ----------
    async def wallpost(self, res):
        """Отправка события стены клиенту (вызывается через channel_layer)"""
        try:
            # Убеждаемся, что res содержит все нужные поля
            await self.send(text_data=json.dumps(res))
        except Exception as e:
            print(f"Error sending wallpost: {e}")

    async def send_message(self, res):
        """Отправка приватного сообщения клиенту (вызывается через channel_layer)"""
        try:
            # Убеждаемся, что res содержит все нужные поля
            await self.send(text_data=json.dumps(res))
        except Exception as e:
            print(f"Error sending message: {e}")
