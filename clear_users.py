import os
import time
import random
from myapp.models import User, Post, Comment, UserChannels, Relationship, Relike
from privatemessages.models import Thread, Message
from redis_om import get_redis_connection
from simple_api_client import DATA
redis = get_redis_connection()

def delete_user():
    users_all = User.objects.all()

    for i in users_all:
        p = Post.objects.filter(user_post=i)
    #    if i.username.split("_")[0] == "sadko":
        if i.username == "a":
            #if len(p) == 0:
                redis.delete("redis_channels:user:"+str(i.id))
                redis.delete("redis_search:myapp.ormsearch.UserDocument:"+str(i.id))
                os.system(f"rm -rf media/data_image/{i.path_data}")
                Comment.objects.filter(comment_user=i).all().delete()
                Thread.objects.filter(participants=i).all().delete()
                Message.objects.filter(sender=i).all().delete()
                i.delete()
#delete_user()
            
def remove_images():
    users_all = User.objects.all()
    for i in users_all:
        images = DATA()
        images.parseIMG(f"media/data_image/{i.path_data}")
        p = Post.objects.filter(user_post=i)
        del images.file[i.image_user.split(".")[0]]
        del images.file["tm_"+i.image_user.split(".")[0]]
        for post in p:
            del images.file[post.image.split(".")[0]]
        #print (images.file)
        for F in images.file:
            print (images.file[F][0])
            os.system(f"rm -rf {images.file[F][0]}")
        #images.file[file_path][0] 

def remove_follow_self():
    user = User.objects.get(username="a")
    friends = Relationship.objects.filter(from_person=user)
    for i in friends:
        if i.to_person == user:
            i.delete()
    
def remove_follow_all():
    friends = Relationship.objects.all()
    for i in friends:
        i.delete()  
        
def remove_like_all():
    friends = Relike.objects.all()
    for i in friends:
        i.delete()          
