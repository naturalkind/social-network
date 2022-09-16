import requests as R
import os
import time
import random

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
print (len(images.file))


url = "http://178.158.131.41:8888/register/"
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
with R.session() as client:
        for i in range(10):
            get_reg = client.get(url)
            payload = {'username':'sadko_'+str(i),'password2':'1', 'password1':'1', 'csrfmiddlewaretoken':get_reg.cookies['csrftoken']}
            file_path = random.choice(list(images.file.keys()))
            _files = {'image_user':open(images.file[file_path][0], 'rb')}
            result = client.post(url, data = payload, files=_files)
            print (result)

