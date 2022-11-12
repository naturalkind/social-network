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
       print ("PARSING",path)
       for r, d, f in os.walk(path):
           for ix, file in enumerate(f):
                      if ".png" in file.lower():
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]
                      if ".jpg" in file.lower(): 
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]
                      if ".jpeg" in file.lower(): 
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]
images = DATA()
images.parseIMG("/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/IMAGE")
print (f"RUN... COUNT IMAGE FILE: {len(images.file)}")

# пользователи
def users(num_page):
    url = f"http://178.158.131.41:8888/users/?page={num_page}";
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
    url = f"http://178.158.131.41:8888/user/{id_user}/?page={num_page}";
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
    url = "http://178.158.131.41:8888/register/"
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
            
    url = "http://178.158.131.41:8888/login"
    with R.session() as client:
        get_reg = client.get(url)
        csrftoken = client.cookies['csrftoken']
        login_data = dict(username=user, password=password, csrfmiddlewaretoken=csrftoken, next='/')
        r = client.post(url, data=login_data, headers=dict(Referer=url))
        get_reg = client.get("http://178.158.131.41:8888/")
        ws = websocket.WebSocketApp("ws://xn--90aci8aadpej1e.com:80/",
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
            
    url = "http://178.158.131.41:8888/login"
    with R.session() as client:
        get_reg = client.get(url)
        csrftoken = client.cookies['csrftoken']
        login_data = dict(username=user, password=password, csrfmiddlewaretoken=csrftoken, next='/')
        r = client.post(url, data=login_data, headers=dict(Referer=url))
        get_reg = client.get("http://178.158.131.41:8888/")
        ws = websocket.WebSocketApp("ws://xn--90aci8aadpej1e.com:80/",
                                     on_message=on_message,
                                     on_error=on_error,
                                     cookie = f"csrftoken={client.cookies['csrftoken']}; sessionid={client.cookies['sessionid']}")
       
        
        
        ws.on_open = on_open
        ws.run_forever()


if __name__ == "__main__":
    print ("RUN...", sys.argv[1])
    #"naturalkind", "1"
    if sys.argv[1] == "register":
        register() # создание пользователей
    elif sys.argv[1] == "post_datas":
        post_datas(sys.argv[2], sys.argv[3]) # отправить много данных пользователя через websocket USER, PASSWORD ->
    elif sys.argv[1] == "post_data":        
        post_data(sys.argv[2], sys.argv[3]) # отправить данные пользователя через websocket USER, PASSWORD ->
    elif sys.argv[1] == "user_data":
        user_data(1, 1) # данные пользователя ID, PAGE ->
    elif sys.argv[1] == "users":
        users(1) # пользователи PAGE ->

