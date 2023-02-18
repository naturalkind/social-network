import argparse
import requests as R
import os
import time
import sys
import random
import json
import websocket
import base64
from threading import Thread

class DATA(object):
   def __init__(self):
       self.file = {}
       self.label = {}
   def parseIMG(self, dir_name):
       path = dir_name+"/"
       for r, d, f in os.walk(path):
           for ix, file in enumerate(f):
                      if ".png" in file.lower():
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]
                      if ".jpg" in file.lower(): 
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]
                      if ".jpeg" in file.lower(): 
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]

# пользователи
def users(num_page):
    url = f"http://сообщество.com/users/?page={num_page}";
    with R.session() as client:
        get_reg = client.get(url)
        data = json.loads(get_reg.text)
        all_pages = data["all_pages"]
        data = json.loads(data["data"])
        print ("HEADERS:", get_reg.headers)
        print (f"DATA PAGE: {all_pages}, COUNT DATA: {len(data)}")   
        for i in data:
            print (f"ID DATA: {i['pk']}")   


# данные пользователей
def user_data(id_user, num_page):
    url = f"http://сообщество.com/user/{id_user}/?page={num_page}";
    with R.session() as client:
        get_reg = client.get(url)
        data = json.loads(get_reg.text)
        all_pages = data["all_pages"]
        data = json.loads(data["data"])
        print ("HEADERS:", get_reg.headers)
        print (f"DATA PAGE: {all_pages}, COUNT DATA: {len(data)}")   
        for i in data:
            print (f"ID DATA: {i['pk']}")  


# создание пользователей
def register():
    url = "http://сообщество.com/register/"
    with R.session() as client:
            for i in range(1000):
                get_reg = client.get(url)
                payload = {'username':'sadko_'+str(i),'password2':'1', 'password1':'1', 'csrfmiddlewaretoken':get_reg.cookies['csrftoken']}
                file_path = random.choice(list(images.file.keys()))
                _files = {'image_user':open(images.file[file_path][0], 'rb')}
                result = client.post(url, data = payload, files=_files)
                print (result)
                

# отправить данные пользователя через websocket
def post_data(user="sadko_1", password="1"):
    global index
    global offset
    index = 0
    offset = 0
    file_path = random.choice(list(images.file.keys()))
    file_path = images.file[file_path][0] 
    _file = open(file_path, "rb")

    Name = file_path.split("/")[-1]
    Size = os.path.getsize(file_path)


    def on_message(ws, message):
        global index
        global offset
        data = json.loads(message);
        if data["status"] == "MoreData":
            print ("STATUS...", data)
            for chunk in read_in_chunks(_file, 1024*1024):
                offset = index + len(chunk)
                index = offset
                chunk = base64.b64encode(chunk).decode('utf-8')
                chunk = "data:application/octet-stream;base64," + chunk
                data = json.dumps({'event':'Upload', 'Name' : 'more', 'Data' : chunk })    
                ws.send(data) 
                time.sleep(1)       
        else:
            print ("ELSE...", data)      

    def on_error(ws, error):
        print("ERROROR.....", error)


    def on_close(ws, close_status_code, close_msg):
        print("### closed ###")

    def on_open(ws):
        def run(*args):
            data = json.dumps({'event': 'Start', 'Name' : Name, 'Size' : Size}) 
            ws.send(data)
            time.sleep(1)
            data = json.dumps({"title":"test", "body":"test", "image":"test","event":"wallpost"})
            ws.send(data) 
            time.sleep(1)     
            ws.close()
            print("Thread terminating...", Name, Size )

        Thread(target=run).start()
            

    def read_in_chunks(_file, chunk_size=1024*1024):
        while True:
            data = _file.read(chunk_size)
            if not data:
                break
            yield data  
            
    url = "http://сообщество.com/login"
    with R.session() as client:
        get_reg = client.get(url)
        csrftoken = client.cookies['csrftoken']
        login_data = dict(username=user, password=password, csrfmiddlewaretoken=csrftoken, next='/')
        r = client.post(url.encode('utf-8'), data=login_data, headers=dict(Referer=url.encode('utf-8')))
        get_reg = client.get("http://сообщество.com/")
        ws = websocket.WebSocketApp("ws://сообщество.com:80/",
                                     on_message=on_message,
                                     on_error=on_error,
                                     cookie = f"csrftoken={client.cookies['csrftoken']}; sessionid={client.cookies['sessionid']}")
        ws.on_open = on_open
        ws.run_forever()
        

# отправить много данных пользователя через websocket
def post_datas(user="sadko_1", password="1"):
    global index
    global offset 
    index = 0
    offset = 0
    def on_message(ws, message):
        global _file
        global index
        global offset    
        data = json.loads(message);
        if data["status"] == "MoreData":
            print ("STATUS...", data)
            for chunk in read_in_chunks(_file, 1024*1024):
                offset = index + len(chunk)
                index = offset
                chunk = base64.b64encode(chunk).decode('utf-8')
                chunk = "data:application/octet-stream;base64," + chunk
                data = json.dumps({'event':'Upload', 'Name' : 'more', 'Data' : chunk })    
                ws.send(data) 
                time.sleep(1)       
        else:
            print ("ELSE...", data)      

    def on_error(ws, error):
        print("ERROROR.....", error)


    def on_close(ws, close_status_code, close_msg):
        print("### closed ###")

    def on_open(ws):
        def run(*args):
            for i in range(1000):
                file_path = random.choice(list(images.file.keys()))
                file_path = images.file[file_path][0] 
                global _file
                _file = open(file_path, "rb")
                Name = file_path.split("/")[-1]
                Size = os.path.getsize(file_path) 
                index = 0
                offset = 0
                data = json.dumps({'event': 'Start', 'Name' : Name, 'Size' : Size}) 
                ws.send(data)
                time.sleep(1)
                data = json.dumps({"title":"test", "body":"test", "image":"test","event":"wallpost"})
                ws.send(data) 
                time.sleep(1)    
            time.sleep(1)             
            ws.close()
            print("Thread terminating...", Name, Size )
        Thread(target=run).start()            

    def read_in_chunks(_file, chunk_size=1024*1024):
        while True:
            data = _file.read(chunk_size)
            if not data:
                break
            yield data  
            
    url = "http://сообщество.com/login"
    with R.session() as client:
        get_reg = client.get(url)
        csrftoken = client.cookies['csrftoken']
        login_data = dict(username=user, password=password, csrfmiddlewaretoken=csrftoken, next='/')
        r = client.post(url.encode('utf-8'), data=login_data, headers=dict(Referer=url.encode('utf-8')))
        get_reg = client.get("http://сообщество.com/")
        ws = websocket.WebSocketApp("ws://сообщество.com:8888/",
                                     on_message=on_message,
                                     on_error=on_error,
                                     cookie = f"csrftoken={client.cookies['csrftoken']}; sessionid={client.cookies['sessionid']}")
       
        
        
        ws.on_open = on_open
        ws.run_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Взаимодействией через WEB')
    parser.add_argument('--imagedir', 
                        default="/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/FILE_APP/IMAGE", 
                        type=str, 
                        dest="imagedir",
                        help='Папка с изображениями')
    parser.add_argument('--reg', 
                        default=False, 
                        type=str,
                        dest="registration",
                        help='Регистрация')                            
    parser.add_argument('--postdatas', 
                        default=False, 
                        type=str,
                        dest="postdatas",
                        help='Добавление данных в цикле')   
    parser.add_argument('--postdata', 
                        default=False, 
                        type=str,
                        dest="postdata",
                        help='Добавление единичныйх данных')  
    parser.add_argument('--userdata', 
                        default=False, 
                        type=str,
                        dest="userdata",
                        help='Данные пользователя')                          
    parser.add_argument('--users', 
                        default=False, 
                        type=str,
                        dest="users",
                        help='Пользоветели')  
    parser.add_argument('--username', 
                        default="sadko_0", 
                        type=str,
                        dest="username",
                        help='Имя')                          
    parser.add_argument('--password', 
                        default="1", 
                        type=str,
                        dest="password",
                        help='Пароль')                       
    parser.add_argument('--iduser', 
                        default=0, 
                        type=int,
                        dest="iduser",
                        help='ID пользователя') 
    parser.add_argument('--page', 
                        default=0, 
                        type=int,
                        dest="page",
                        help='Номер страниц')  
                     
    args = parser.parse_args()

    images = DATA()
    images.parseIMG(args.imagedir)
    print (f"{args}\n RUN... COUNT IMAGE FILE: {len(images.file)}")
    if args.registration != False:
        register() # создание пользователей
    if args.postdatas != False:
        post_datas(args.username, args.password) # отправить много данных пользователя через websocket USER, PASSWORD ->
    if args.postdata != False:
        post_data(args.username, args.password)  # отправить данные пользователя через websocket USER, PASSWORD ->
    if args.userdata != False:
        user_data(args.iduser, args.page) # данные пользователя ID, PAGE ->
    if args.users != False:
        users(args.page) # пользователи PAGE ->

