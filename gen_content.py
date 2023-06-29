import os
import time
import random
from myapp.models import User, Post, Comment, RELATIONSHIP_FOLLOWING
from wall.nnapp import send_and_get

class DATA(object):
   def __init__(self):
       self.file = {}
       self.label = {}
   def parseIMG(self, dir_name):
       path = dir_name+"/"
       print ("PARSING", path)
       for r, d, f in os.walk(path):
           for ix, file in enumerate(f):
                      if ".png" in file.lower():
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]
                      if ".jpg" in file.lower(): 
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]
                      if ".jpeg" in file.lower(): 
                          self.file[file.split(".")[0]] = [os.path.join(r, file)]


images = DATA()
images.parseIMG("/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/FILE_APP/IMAGE")
print (len(images.file))


def cop(x, y):
     f_file = open(x, "rb").read()
     to_file = open(y,"wb").write(f_file)


# генерация материала
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
                old_name = images.file[file_path][0].split("/")[-1]
                cop(images.file[file_path][0], f"media/data_image/{i.path_data}/{old_name}")
                post.image = old_name
                post.path_data = str(i.path_data)
                post.user_post = i
                post.save()             


# генирация друзья random.choice
def gen_relationship_user_random():
    print ("START GEN_RELATIONSHIP_USER_RANDOM")
    users_all = User.objects.all()
    users_all_count = User.objects.all().count()
    for u in users_all:
        file_path = random.choice(range(users_all_count))
        if u.pk != file_path:
            u.add_relationship(list(users_all)[file_path], RELATIONSHIP_FOLLOWING)
            list(users_all)[file_path].add_relationship(u, RELATIONSHIP_FOLLOWING)
    print (f"Пользоветели: {users_all_count}")
    

# генирация друзья
def gen_relationship_user():
    print ("START GEN_RELATIONSHIP_USER")
    users_all = User.objects.all()
    for u in users_all[:]:
        for uu in users_all: 
            u.add_relationship(uu , RELATIONSHIP_FOLLOWING)
    print (f"Пользоветели: {users_all.count()}")
 

# генирация комментариев
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


# генирация 'лайков'
def gen_like_post():
    users_all = User.objects.all()
    posts_all = Post.objects.all()
    for p in posts_all: 
        for u in users_all:
            ans = p
            if ans.likes.filter(id=u.id).exists():
                print (u, p)   
            else:
                ans.likes.add(u)
                ans.point_likes += int(1)
                ans.save()   
#    for user in users_all:
#        posts_like_user = Post.objects.all().filter(likes=user) 
#        print ("gen_like_post...", posts_like_user)


# генирация репоста
def gen_repost():
    users_all = User.objects.all()
    posts_all = Post.objects.all()
    for p in posts_all: 
        for u in users_all:
            ans = p
            if ans.relike.filter(id=u.id).exists():
                print (u, p)   
            else:
                ans.add_rela(u, RELATIONSHIP_FOLLOWING)


# генерация изображения если произошла ошибка    
def new_gen_img():
    user = User.objects.get(username="")
    posts_all = Post.objects.filter(user_post=user)
    for i in posts_all:
        if i.image=="":
            _temp_dict = {}
            _temp_dict["title"] = i.body
            _temp_dict["path_data"] = user.path_data
            _temp_dict["post"] = str(i.id)
            _temp_dict["type"] = "triggerWorker"
            _temp_dict["room_group_name"] = "wall"         
            print (i.body, i.image=="")
            send_and_get(_temp_dict, model='Kandinsky-2.0')
        else:
            os.system(f"rm -rf media/data_image/{user.path_data}/{i.image}")
            _temp_dict = {}
            _temp_dict["title"] = i.body
            _temp_dict["path_data"] = user.path_data
            _temp_dict["post"] = str(i.id)
            _temp_dict["type"] = "triggerWorker"
            _temp_dict["room_group_name"] = "wall" 
            send_and_get(_temp_dict, model='Kandinsky-2.0')  


new_gen_img()
#gen_post() # генерация материала
#gen_relationship_user_random() # генирация друзья random.choice
#gen_relationship_user() # генирация друзья
#gen_comment() # генерация комментариев 
#gen_like_post() # генирация 'лайков'
#gen_repost() # генирация репоста









