import os
import time
import random
from myapp.models import User, Post


from myapp.models import User
#print (dir(User))
user_count = User.objects.all()

for i in user_count:
    i.color = "#507299"
    i.save()
         

