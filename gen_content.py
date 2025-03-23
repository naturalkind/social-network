# Добавляем в начало файла
from django.conf import settings
import shutil
import os
import time
import random
import argparse
import json
import re, uuid
from pathlib import Path
from myapp.models import User, Post, Comment, RELATIONSHIP_FOLLOWING
from wall.nnapp import send_and_get
from gen_nikename import generate_nicknames
from django.contrib.auth.hashers import make_password
from PIL import Image
import filetype  # Альтернатива для определения MIME-типов

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
   def get_image_list(self):
        return list(self.file.values())

images = DATA()
images.parseIMG("/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/FILE_APP/IMAGE")
print (f"Loading data from folder len: {len(images.file)}")
available_images = images.get_image_list()
used_images = set()
# Путь к файлу с логами пользователей
USER_LOGS_FILE = Path("/media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/social-network/media/generated_users.json")

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
def new_gen_img(UserName):
    user = User.objects.get(username=UserName)
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

def convert_to_png(source_path, dest_path):
    """Конвертирует изображение в PNG и сохраняет по указанному пути"""
    try:
        with Image.open(source_path) as img:
            # Конвертируем в RGB для JPEG и других форматов с альфа-каналом
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(dest_path, 'PNG', optimize=True)
        return True
    except Exception as e:
        print(f"Ошибка конвертации {source_path} в PNG: {str(e)}")
        return False
        
def get_image_format(file_path):
    """Определяет формат изображения с помощью Pillow и filetype"""
    try:
        # Первичная проверка через filetype (опционально)
        kind = filetype.guess(file_path)
        if kind:
            return kind.extension.lower()
            
        # Резервная проверка через Pillow
        with Image.open(file_path) as img:
            return img.format.lower() if img.format else None
            
    except (UnidentifiedImageError, IOError):
        return None
    except Exception as e:
        print(f"Ошибка при анализе файла {file_path}: {str(e)}")
        return None

# Генерация пользователей
def gen_users(count=5):
    """Генерация пользователей с аватарками"""
    print("START GEN_USERS")
    # Загрузка существующих логов
    existing_logs = []
    if USER_LOGS_FILE.exists():
        with open(USER_LOGS_FILE, 'r') as f:
            existing_logs = json.load(f)    
    
    global available_images, used_images
    
    # Проверяем доступные изображения
    if not available_images:
        print("ОШИБКА: Нет доступных изображений в указанной папке")
        return

    existing_users = set(User.objects.values_list('username', flat=True))
    all_nicks = generate_nicknames()
    available_nicks = [n for n in all_nicks if n not in existing_users]
    
    created = 0
    for i in range(min(count, len(available_nicks), len(available_images))):
        if not available_images:
            print("Все изображения исчерпаны, остановка генерации")
            break

        # Выбираем случайное изображение
        img_data = random.choice(available_images)
        img_path = img_data[0]
        available_images.remove(img_data)
        used_images.add(img_path)

        username = available_nicks[i]
        # Генерация пароля
        clean_password = re.sub(r'[\W_]+', '', username)
        
        if len(clean_password) < 8:
            clean_password += str(random.randint(1000, 9999))

        # Создаем пользователя
        user = User(
            username=username,
            email=f"{username}@example.com",
            password=make_password(clean_password),
            path_data=str(uuid.uuid4()),  # Уникальный путь
            color="#{:06x}".format(random.randint(0, 0xFFFFFF))  # Случайный цвет
        )

        # Копируем и сохраняем изображение
        try:
            filename = os.path.basename(img_path)
            user_dir = os.path.join(settings.MEDIA_ROOT, 'data_image', user.path_data)
            os.makedirs(user_dir, exist_ok=True)
            
            # Определение реального формата
            real_ext = get_image_format(img_path) or 'png'
            base_name = os.path.splitext(filename)[0]
            #new_filename = f"{base_name}.{real_ext}"
            new_filename = f"{base_name}.png"
            dest_path = os.path.join(user_dir, new_filename)
            # Конвертация в PNG (если требуется)
            if real_ext != 'png':
                convert_to_png(img_path, dest_path)
            else:
                shutil.copyfile(img_path, dest_path)
            user.image_user = new_filename #os.path.join('users', user.path_data, new_filename)
            
            
            new_filename = f"tm_{base_name}.png"
            modified_path = os.path.join(user_dir, new_filename)
            img = Image.open(img_path)
            # Get current and desired ratio for the images
            img_ratio = img.size[0] / float(img.size[1])
            size = (150, 150)
            ratio = size[0] / float(size[1])
            #The image is scaled/cropped vertically or horizontally depending on the ratio
            if ratio > img_ratio:
                img = img.resize((size[0], int(size[0] * img.size[1] / img.size[0])),
                        Image.ANTIALIAS)
                box = (0, int((img.size[1] - size[1]) / 2), img.size[0], int((img.size[1] + size[1]) / 2))
                img = img.crop(box)
            elif ratio < img_ratio:
                img = img.resize((int(size[1] * img.size[0] / img.size[1]), size[1]),
                        Image.ANTIALIAS)
                # Crop in the top, middle or bottom
                box = (int((img.size[0] - size[0]) / 2), 0, int((img.size[0] + size[0]) / 2), img.size[1])
                img = img.crop(box)
            else :
                img = img.resize((size[0], size[1]),
                        Image.ANTIALIAS)
                # If the scale is the same, we do not need to crop
            print ("---------->", filename, real_ext, new_filename, modified_path)
            img.save(modified_path)
            
            
            
        except Exception as e:
            print(f"Ошибка обработки изображения: {str(e)}")
            user.image_user = "oneProf.png"

        user.save()
        created += 1
        
        # Логирование данных
        user_data = {
            "path_data": user.path_data,
            "username": username,
            "password": clean_password,
            "image": user.image_user,
            "created_at": str(time.time())
        }
        existing_logs.append(user_data)
        print(f"Создан пользователь: {username}")
    # Сохранение обновленных логов
    with open(USER_LOGS_FILE, 'w') as f:
        json.dump(existing_logs, f, indent=2) 
                       
def delete_generated_users():
    """Удаление всех сгенерированных пользователей"""
    print("START USER DELETION")
    
    if not USER_LOGS_FILE.exists():
        print("Файл с логами пользователей не найден!")
        return

    with open(USER_LOGS_FILE, 'r') as f:
        users_data = json.load(f)

    deleted_count = 0
    for user in users_data:
        try:
            # Удаляем пользователя и связанные данные
            User.objects.filter(username=user['username']).delete()
#            
            # Удаляем медиа-файлы
#            user_dir = os.path.join(settings.MEDIA_ROOT, os.path.dirname(user['image']))
            user_dir = os.path.join(settings.MEDIA_ROOT, "data_image", user["path_data"])
            print (user, user_dir)
            if os.path.exists(user_dir):
                shutil.rmtree(user_dir)
                print(f"Удалена директория: {user_dir}")
            
            deleted_count += 1
        except Exception as e:
            print(f"Ошибка удаления {user['username']}: {str(e)}")

    # Очищаем файл логов
    USER_LOGS_FILE.unlink()
    
    print(f"Удалено пользователей: {deleted_count}")
    print("Все связанные данные и медиа-файлы удалены")

gen_users(count=len(images.file))
#delete_generated_users()
#if __name__ == '__main__':
    #gen_users()
    #delete_generated_users()
    #new_gen_img("UserName") # генерация изображения если произошла ошибка 
    #gen_post() # генерация материала
    #gen_relationship_user_random() # генирация друзья random.choice
    #gen_relationship_user() # генирация друзья
    #gen_comment() # генерация комментариев 
    #gen_like_post() # генирация 'лайков'
    #gen_repost() # генирация репоста









