import os
import time
import random
from myapp.models import User, Post, Comment, RELATIONSHIP_FOLLOWING

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

def gen_post():
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


def gen_like_random():
    print ("START gen_like_random")
    users_all = User.objects.all()
    users_all_count = User.objects.all().count()
    posts_all = Post.objects.all()
    for u in users_all:
        file_path = random.choice(range(users_all_count))
        if u.pk != file_path:
            u.add_relationship(list(users_all)[file_path], RELATIONSHIP_FOLLOWING)
            list(users_all)[file_path].add_relationship(u, RELATIONSHIP_FOLLOWING)
    print (f"Пользоветели: {len(list(users_all))}; Посты: {len(list(posts_all))}")
    
#gen_like_random()    

def gen_like():
    print ("START gen_like")
    users_all = User.objects.all()
    posts_all = Post.objects.all()
    for u in users_all[:2]:
        for uu in users_all: 
            u.add_relationship(uu , RELATIONSHIP_FOLLOWING)
    print (f"Пользоветели: {users_all.count()}; Посты: {posts_all.count()}")
 
#gen_like()

def gen_comment():
    print ("START gen_comment")
    users_all = User.objects.all()
    posts_all = Post.objects.all()
    for p in posts_all: 
        for u in users_all:
            print (u, p)
            comment = Comment()
            comment.comment_text = "это тестовое сообщение"
            comment.comment_image = ""
            comment.post_id = p
            comment.comment_user = u
            comment.save()
    print (f"Пользоветели: {users_all.count()}; Посты: {posts_all.count()}")

gen_comment()    
    
    

