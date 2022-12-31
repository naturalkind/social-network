import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from myapp.models import User, Post, Comment
from importlib import import_module

from django.conf import settings
from django.utils import dateformat
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async

import datetime
import asyncio
import aioredis
import async_timeout
import re
import redis
import time
import uuid
import base64, io, os
session_engine = import_module(settings.SESSION_ENGINE)

#############################

import threading

import zmq.green as zmq # required since we are in gevents
import zlib
import pickle

def compress(obj):
    p = pickle.dumps(obj)
    return zlib.compress(p)


def decompress(pickled):
    p = zlib.decompress(pickled)
    return pickle.loads(p)

work_publisher = None
result_subscriber = None
TOPIC = 'snaptravel'

RECEIVE_PORT = 5555
SEND_PORT = 5556 

def start():
    global work_publisher, result_subscriber
    context = zmq.Context()
    work_publisher = context.socket(zmq.PUB)
    work_publisher.connect(f'tcp://127.0.0.1:{SEND_PORT}') 

def _parse_recv_for_json(result, topic=TOPIC):
    compressed_json = result[len(topic) + 1:]
    return decompress(compressed_json)

def send(args, model=None, topic=TOPIC):
#    print (args, model, topic)
    id = str(uuid.uuid4())
    message = {'body': args["title"], 'model': model, 'id': id}
    compressed_message = compress(message)
    work_publisher.send(f'{topic} '.encode('utf8') + compressed_message)
    return id

def get(id, topic=TOPIC):
    context = zmq.Context()
    result_subscriber = context.socket(zmq.SUB)
    result_subscriber.setsockopt(zmq.SUBSCRIBE, topic.encode('utf8'))
    result_subscriber.connect(f'tcp://127.0.0.1:{RECEIVE_PORT}')
    #  print ("GET", id, topic.encode('utf8'), result_subscriber.recv())
    result = _parse_recv_for_json(result_subscriber.recv())

    while result['id'] != id:
        result = _parse_recv_for_json(result_subscriber.recv())

    result_subscriber.close()

    if result.get('error'):
        raise Exception(result['error_msg'])

    #  return result['prediction']
    return result


from asgiref.sync import async_to_sync      
#import sys
#sys.path.insert(0, '/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/PLAYGROUND/Kandinsky_2.0/Kandinsky-2.0')
#from start_celery import func_celery   
#############################
# KEYSTROKE
import faiss
import string
import numpy as np
import tensorflow as tf
import tensorflow_addons as tfa
from clickhouse_driver import Client as ClientClickhouse

#model_idx = tf.keras.applications.VGG16(include_top=False, 
#                                    weights='imagenet', 
#                                    input_tensor=None, 
#                                    input_shape=None, 
#                                    pooling='max')
#                                    
#preprocess_idx = tf.keras.applications.vgg16.preprocess_input


alf_ = ord('а')
abc_ = ''.join([chr(i) for i in range(alf_, alf_+32)])
abc_ += " ,."
#abc_ = string.ascii_lowercase + " ,."
combination = ["ст", "то", "но", "на", "по", "ен", "ни", "не", "ко", "ра", "ов", "ро", "го", "ал",
               "пр", "ли", "ре", "ос", "во", "ка", "ер", "от", "ол", "ор", "та", "ва", "ел", "ть",
               "ет", "ом", "те", "ло", "од", "ла", "ан", "ле", "ве", "де", "ри", "ес", "ат", "ог",
               "ль", "он", "ны", "за", "ти", "ит", "ск", "ил", "да", "ой", "ем", "ак", "ме", "ас",
               "ин", "об", "до", "че", "мо", "ся", "ки", "ми", "се", "тр", "же", "ам", "со", "аз",
               "нн", "ед", "ис", "ав", "им", "ви", "тв", "ар", "бы", "ма", "ие", "ру", "ег", "бо",
               "сл", "из", "ди", "чт", "вы", "вс", "ей", "ия", "пе", "ик", "ив", "сь", "ое", "их",
               "ча", "ну", "мы"] # 101   

control_text = """повторим этот эксперимент несколько раз с одним и тем же оператором и посмотрим,
как будет изменяться статистика на этом коротком тесте. обязательно фиксируем условия, в
которых работает оператор. желательно, чтобы сначала работал в одних и тех же условиях.
повторим этот эксперимент несколько раз с одним и тем же оператором и посмотрим, как будет
изменяться статистика на этом коротком тесте. обязательно фиксируем условия, в которых
работает оператор. желательно, чтобы сначала работал в одних и тех же условиях.
повторим этот эксперимент несколько раз с одним и тем же оператором и посмотрим, как будет
изменяться статистика на этом коротком тесте. обязательно фиксируем условия, в которых
работает оператор. желательно, чтобы сначала работал в одних и тех же условиях."""

# clickhouse
class DataBase():
    def __init__(self):
        self.client = ClientClickhouse('localhost', settings = { 'use_numpy' : True })
 
    def createDB(self, x="face_id_table"):
    
        self.client.execute(f"""CREATE TABLE {x} 
                                (ID Int64,
                                 User String) 
                            ENGINE = MergeTree() ORDER BY User""")
    def delete(self, x):
        self.client.execute(f'DROP TABLE IF EXISTS {x}')    
    def show_count_tables(self, x):
        start = time.time()
        LS = self.client.execute(f"SELECT count() FROM {x}")
        print (time.time()-start, LS)
        return LS
    def show_tables(self):
        print (self.client.execute('SHOW TABLES'))        
    def get_all_data(self, x):
        start = time.time()
        LS = self.client.execute(f"SELECT * FROM {x}")
        print (time.time()-start, len(LS)) 
        return LS
# user data      -------------->

clickhouse_table_name = "keypress_id_table"   
clickhouse_db = DataBase()
clickhouse_db.delete(clickhouse_table_name)
clickhouse_db.createDB(clickhouse_table_name)
        
def median_filter(data, filt_length=3):
    '''
    Computes a median filtered output of each [n_bins, n_channels] data sample
        and returns output w/ same shape, but median filtered

    NOTE: as TF doesnt have a median filter implemented, this had to be done in very hacky way...
    '''
    edges = filt_length// 2

    # convert to 4D, where data is in 3rd dim (e.g. data[0,0,:,0]
    exp_data = tf.expand_dims(tf.expand_dims(data, 0), -1)
    print ("median_filter", exp_data.shape)
    # get rolling window
    wins = tf.image.extract_patches(images=exp_data, sizes=[1, filt_length, 1, 1],
                       strides=[1, 1, 1, 1], rates=[1, 1, 1, 1], padding='VALID')
    # get median of each window
    wins = tf.math.top_k(wins, k=2)[0][0, :, :, edges]
    # Concat edges
    out = tf.concat((data[:edges, :], wins, data[-edges:, :]), 0)

    return out        

############################
class WallHandler(AsyncJsonWebsocketConsumer):
    #async def send_and_get(self, *args, model=None):
    def send_and_get(self, args, model=None):
        id = send(args, model=model)
        print ("SEND.....", id, args, args['path_data'], model)
        res = get(id)
        namefile = f'{id}.jpg'
        res['prediction'][0].save(f'media/data_image/{args["path_data"]}/{namefile}', format="JPEG") 
        print ("SAVE FILE NAME", f'media/data_image/{args["path_data"]}/{namefile}')
        args["post"].image = namefile
        args["post"].save()        
        
        _data = {"type": "wallpost", "status":"Kandinsky-2.0", "path_data": args["path_data"],
                 "data": f'{namefile}', "post":args["post"].id}
        async_to_sync(self.channel_layer.group_send)(self.room_group_name, _data)
        
        #self.channel_layer.group_send(self.room_group_name, _data)

    async def connect(self):
        self.room_name = "wall"
        self.sender_id = self.scope['user'].id
        self.room_group_name = self.room_name
        self.sender_name = self.scope['user']
        if str(self.scope['user']) != 'AnonymousUser':
            self.image_user = self.scope['user'].image_user
            self.path_data = self.scope['user'].path_data
            self.namefile = str()
            
            # embedding data -------------->
            if os.path.exists(f"media/data_image/{self.path_data}/keypress.index"):
                os.remove(f"media/data_image/{self.path_data}/keypress.index")
            
            try:
                self.index = faiss.read_index(f"media/data_image/{self.path_data}/keypress.index")
            except:
                self.index = faiss.IndexFlatL2(len(abc_)*len(abc_))
            
            self.NIDX = 0
            self.previous_Z = 0
            self.control_text_ = ""
        #----------------------->
#        self.Z = np.zeros((len(abc_), 1))
#        self.Z_pad = np.zeros((len(abc_), 1))
        #----------------------->
            
        start()
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
            # KEYSTROKE
            if event == "KEYPRESS":
                print (response)
#                if len(response["arrKey"]) != 0 and len(response["arrKey"])<len(abc_):
#                    self.Z = np.zeros((len(abc_), len(abc_))) 
#                    print (f"Буквы: {abc_}")
#                    print (f"Данные пользователя: {self.sender_name}, {self.sender_id}", response["arrKey"])
#                    for ix, k in enumerate(response["arrKey"]):
#                        if str(k["key_name"]).lower() in abc_:
#                            print (f'БУКВА: {k["key_name"]}; ВРЕМЯ НАЖАТИЯ {k["time_press"]}; индекс в списке полученных данных {ix}') #ix
#                            self.Z[abc_.index(k["key_name"].lower()), ix] += k["time_press"]
#                            
#                            #self.see_idx.append([abc_.index(k["key_name"].lower()), ix, k["time_press"]])
#                    filte_Z = median_filter(np.float32(self.Z))
#                    print (f"Размер полученного вектора: {self.Z.shape}")
#                    filte_Z = filte_Z.numpy()#.reshape(1, len(abc_)*len(abc_))
#                    if (self.NIDX > 0):
#                        one_1 = np.var(np.array([filte_Z, self.previous_Z]), axis = 1, keepdims = True)
#                        print (np.array([filte_Z, self.previous_Z]).shape, one_1.shape)
##                        Sigma = np.cov(filte_Z,previous_Z.reshape(1, len(abc_)*len(abc_)))[0,1]
#                        print (f"СРЕДНЕЕ ЗНАЧЕНИЕ ДИСПЕРСИИ: {np.mean(one_1)}\n")
#                    self.NIDX += 1
#                    self.previous_Z = filte_Z
                
# Будет отвечать за дополнительную проверку перед отправкой
#--------------------------------------->                    
#            if event == "SEND_KEYPRESS":
#                arr_img = np.zeros((224, 224, 3))
#                arr_img[0:self.Z.shape[0], 0:self.Z.shape[1], 0] = self.Z
#                
#                arr_img[-1, -self.Z_pad.shape[1]:, 0] = self.Z_pad
#                
#                vector = deep_vector(arr_img)
#                self.Z = np.zeros((len(abc_), 1))
#                D, I = self.index.search(np.reshape(vector, [1, 512]), 3) 
#                if D[0][0] < 0.6:
#                    INFO = clickhouse_db.client.execute(f"""
#                                                    SELECT *
#                                                    FROM {clickhouse_table_name}
#                                                    WHERE {clickhouse_table_name}.ID = {I[0][0]} 
#                                                  """) 
#                    INFO = INFO[0][1]
#                else:
#                    INFO = "Error"  
#                           
#                print ("SEND_KEYPRESS", D, I, INFO)
#                                               
#                                               
#            if event == "SAVE_KEYPRESS":
#                
#                arr_img = np.zeros((224, 224, 3))
#                arr_img[:self.Z.shape[0], :self.Z.shape[1], 0] = self.Z
#                
#                arr_img[-1, -self.Z_pad.shape[1]:, 0] = self.Z_pad
#                
#                vector = deep_vector(arr_img)
#                
#                self.Z = np.zeros((len(abc_), 1))
#                # clickhouse
#                _ID = int(clickhouse_db.show_count_tables(clickhouse_table_name)[0][0])
#                R_N = ms['NameABC']
#                clickhouse_db.client.execute(f"""INSERT INTO {clickhouse_table_name} 
#                            (ID, User) 
#                            VALUES ({_ID}, '{R_N}')""")
#                self.index.add(np.reshape(vector, [1, 512]))
#                faiss.write_index(self.index, f"media/data_image/{self.path_data}/keypress.index")
#                print ("SAVE_KEYPRESS", R_N, _ID)        
########################################################  
                                                     
            """
            шаг == секунда
            36 - буквы, пробел, точка, запятая
            36 - мы допускаем что за одну секунду не возможно нажать больше 36 символов
            [36,36] - вектор заполняемый нашими данными
            ВЕКТОР [36,36] НЕ МЕНЯЕТ РАЗМЕР
            ВЕКТОР [36,36] ПРИ СТАРТЕ И ОЧИСТКЕ ЗАПОЛНЯЕТСЯ НУЛЯМИ
            
            для одного человека
            цикл:
                если поступившие данные имеют в себе отслеживаемые символы:
                    на первом шаге:
                        заполняем вектор [36,36] из полученного 
                        получаеим "знаки сочетания" из вектора [36,36]
                        применяем медианный филтр - коррекция ошибок
                        сохраняем вектор [36,36] в базу данных
                        очищаем вектор [36,36]
                    все остальные шаги:
                        заполняем вектор [36,36] из полученного
                        получаеим "знаки сочетания" из вектора [36,36] 
                        применяем медианный филтр - коррекция ошибок
                        из базы данных получаем данные с предыдущего шага, "вектор [36,36]"
                        получаеим дисперсию из вектор [36,36] и "вектор [36,36]"
                        значения дисперсии сохраняем в временный *вектор [36,36]*
                        получаем среднее арефметическое *вектор [36,36]*
                        к среднее арефметическое применяем sigmoid, записываем в переменную
                        
                        если переменная < 0.7
                            подвергаем сомнению личность человека
                            выдаем тест 
                        если переменная > 0.7
                            тест проейден
                            сохраняем полученный вектора [36,36] в базе данных
                        очищаем вектор [36,36]





            if event == "KEYPRESS":
                if len(response["arrKey"]) != 0 and len(response["arrKey"])<len(abc_):
#                    self.Z_pad = np.zeros((1, len(response["arrKey"])))
                    self.Z = np.zeros((len(abc_), len(abc_))) 
                    #self.Z_pad = np.zeros((len(abc_), len(abc_), 1))
                    see_idx = []
                    print (f"Буквы: {abc_}")
                    print (f"Данные пользователя: {self.sender_name}, {self.sender_id}", response["arrKey"])
                    for ix, k in enumerate(response["arrKey"]):
                        if str(k["key_name"]).lower() in abc_:
                            print (f'БУКВА: {k["key_name"]}; ВРЕМЯ НАЖАТИЯ {k["time_press"]}; индекс в списке полученных данных {ix}') #ix
                            self.Z[abc_.index(k["key_name"].lower()), ix] += k["time_press"]
                            
                            see_idx.append([abc_.index(k["key_name"].lower()), ix])
#                            self.Z[abc_.index(k["key_name"].lower()), ix, 0] += k["time_press"]
                            # временно не использую
#                            N = k["end_time_press"] - response["arrKey"][ix-1]["end_time_press"]
#                            if N > float(0):
#                                self.Z_pad[abc_.index(k["key_name"].lower()), ix, 0] = N
                    #tfa.image.median_filter2d()
                    
                    
                    filte_Z = median_filter(np.float32(self.Z))
                    
                    print (f"Размер полученного вектора: {self.Z.shape}")
#                    for k in see_idx:
#                        print (filte_Z[k[0], k[1]])
                    
                    filte_Z = filte_Z.numpy()#.reshape(1, len(abc_)*len(abc_))
                    #self.index.add(filte_Z)
                    #faiss.write_index(self.index, f"media/data_image/{self.path_data}/keypress.index") 
                    if (self.NIDX > 0):
#                        previous_Z = self.index.reconstruct(self.NIDX-1)
                        
                        one_1 = np.var(np.array([filte_Z, self.previous_Z]), axis = 1, keepdims = True)
                        print (np.array([filte_Z, self.previous_Z]).shape, one_1.shape)
#                        one_1 = np.var([filte_Z, 
#                                        previous_Z.reshape(1, len(abc_)*len(abc_))]
#                                        , axis =0, keepdims = True)
#                        Sigma = np.cov(filte_Z,previous_Z.reshape(1, len(abc_)*len(abc_)))[0,1]
                        print (f"СРЕДНЕЕ ЗНАЧЕНИЕ ДИСПЕРСИИ: {np.mean(one_1)}\n")
#                        print (f"СРЕДНЕЕ ЗНАЧЕНИЕ ДИСПЕРСИИ: {np.mean(one_1)}\n",
#                               f"РАЗМЕР ВЕКТОРА ДЛЯ СОХРАНЕНИЯ: {len(abc_)}x{len(abc_)} = {self.previous_Z.shape}") #
                        
                    self.NIDX += 1
#                    previous_Z = self.index.reconstruct(self.NIDX-1)
                    self.previous_Z = filte_Z
                    #self.index.add_with_ids(filte_Z, 0) 
#                    D, I = self.index.search(filte_Z, 10) 
#                    print (D, I)  
                    #NEW = np.concatenate((self.Z_pad, self.Z), axis=2)
#                    print (filte_Z)
                    #print (self.Z)
#                    print (f"ШАГ: {self.NIDX}\n",
#                           f"КОЛИЧЕСТВО РУСКИХ СИМВОЛОВ: {len(abc_)}")
#                    print ("----------------------------------", self.NIDX, self.Z.shape, 
#                                                                 filte_Z.dtype, filte_Z.shape, )


            """

            ##########################################################################
            ##########################################################################
            ##########################################################################        
            if event == "comment_post":
                print ("COMMENT_POST", response)
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
                        "path_data": self.path_data,
                        "image_user": self.image_user,
                        "post_id": response["post_id"],
                        "user_id": self.sender_id,
                        "timecomment":now,
                        "status" : "send_comment"
                    }
                await self.channel_layer.group_send(self.room_group_name, _data)
                
            if event == "wallpost":
                    user_postv = await database_sync_to_async(User.objects.get)(id=self.sender_id)
                    post = Post()
                    post.title = response["title"]
                    post.body = response["body"]
                    post.image = self.namefile
                    post.path_data = self.path_data
                    post.user_post = user_postv
                    post_async = sync_to_async(post.save)
                    await post_async()

                    _data = {"type": "wallpost",
                             "timestamp": dateformat.format(post.date_post, 'U'),
                             "image": self.namefile,
                             "text":response["body"],
                             "user_post": str(self.sender_name),
                             "user_id": self.sender_id,
                             "id": post.id,
                             "image_user" : self.image_user, 
                             "path_data" : self.path_data,
                             "status" : "wallpost"
                            }
                     #----------------------------------------->       
#                    images = await send_and_get(self.temp_dict, model='queue')
#                    results = await sync_to_async(send_and_get, thread_sensitive=True)(self.temp_dict, model='queue')
#                    images = send_and_get(self.temp_dict, model='queue')
#                    print (images)

                    # WORK
#                    await self.send_and_get(self.temp_dict, model='queue')
                    #-----------------------------------------> 
                    # WORK текст в картинку                    
#                    if self.namefile == "":
#                        _temp_dict = {}
#                        _temp_dict["title"] = response["title"]
#                        _temp_dict["path_data"] = self.path_data
#                        _temp_dict["post"] = post
#                        t = threading.Thread(target=self.send_and_get, 
#                                             args=[_temp_dict], 
#                                             kwargs={"model":"Kandinsky-2.0"})
#                        t.start()
                    #-----------------------------------------> 
#                    t.join() 
                    # CELERY
                    #Adata = func_celery.delay({"start":"ok", "room":self.room_group_name})                             
                    print (".................", response["title"])
                    #----------------------------------------->   
                         
                    await self.channel_layer.group_send(self.room_group_name, _data)
                
            if event == "Start":
                self.namefile = f'{str(uuid.uuid4())[:12]}_{response["Name"]}'
                self.myfile = open(f'media/data_image/{self.path_data}/{self.namefile}', "wb")
                
                _data = {"type": "wallpost", "status":"MoreData"}
                await self.channel_layer.group_send(self.room_group_name, _data)

            if event == "Upload":
                da = response["Data"]
                da = da.split(",")[1]
                file_bytes = io.BytesIO(base64.b64decode(da)).read()
                self.myfile.write(file_bytes)
                _data = {"type": "wallpost", "status":"MoreData"}
                await self.channel_layer.group_send(self.room_group_name, _data)
                
            if event == "Done":
                _data = {"type": "wallpost", "status":"Done"}
                await self.channel_layer.group_send(self.room_group_name, _data)

            
            if event == "deletepost":
                post = await database_sync_to_async(Post.objects.get)(id=response["id"])
                await sync_to_async(post.delete)()
                _data = {"type": "wallpost", "status":"deletepost"}
                await self.channel_layer.group_send(self.room_group_name, _data)
        else:
            await self.channel_layer.group_send(self.room_group_name, {"type": "wallpost"})           

    async def wallpost(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        print ("WALLPOST", res)
        await self.send(text_data=json.dumps(res))


