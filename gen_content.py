import os
import time
import random
from myapp.models import User, Post

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

def cop(x, y):
     f_file = open(x, "rb").read()
     to_file = open(y,"wb").write(f_file)

from myapp.models import User
#print (dir(User))
user_count = User.objects.count()
U = User.objects.all()
print (user_count)

def chunks(lst, count):
    start = 0
    for i in range(count):
          stop = start + len(lst[i::count])
          yield lst[start:stop]
          start = stop 
test = chunks(U, 5)
for us in test:
    for i in us:
        for jj in range(10):
            post = Post()
            post.title = "test"
            post.body = ""
            file_path = random.choice(list(images.file.keys()))
            old_name = images.file[file_path][0].split("/")[-1]#.split(".")[0]
            cop(images.file[file_path][0], f"media/data_image/{i.path_data}/{old_name}")
            post.image = old_name
            post.path_data = str(i.path_data)
            post.user_post = i
            post.save()             

