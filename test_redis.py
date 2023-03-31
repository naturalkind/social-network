import asyncio
import aioredis
import async_timeout

import redis
from redis_om import HashModel, JsonModel, get_redis_connection
from redis_om.model.model import (
    EmbeddedJsonModel,
    Expression,
    NotFoundError,
    RedisModel,
)


r = redis.StrictRedis(host='localhost', port=6379, db=0)#, decode_responses=True)#redis.Redis()#
#args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%bea%']
#args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:be*']
#args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%sad%']


#args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%sa%']
args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%sadko_10%']

#class UserChannels(JsonModel):#, ABC): HashModel
#    channels: str
#    class Meta:
#        global_key_prefix = "redis_channels"  
#        model_key_prefix = "user"

#print (UserChannels.get(1))

#args = ['ft.search', 'redis_search:myapp.ormsearch.PostDocument:index', '@body_fts:Белка']
#print (RedisModel.db().execute_command(*args))

#for i in r.keys():
#    try:
#        data = r.json().get(i)
#        print (i)
#        print (data)
#        print ("----------------")
#    except:
#        print ("ERROR....",i)
#        pass

#FT.SEARCH redis_search:myapp.ormsearch.PostDocument:index "@body_fts:Птичка"
#FT.CREATE p_index prefix 1 redis_search:myapp.ormsearch.PostDocument: SCHEMA body TEXT
#FT.SEARCH redis_search:myapp.ormsearch.PostDocument:index "*=>[KNN 10 @body_fts $query_vec AS title_score]" PARAMS 2 query_vec <"Planet Earth" fts BLOB> SORTBY title_score DIALECT 2


# WORK
#try:
#    name = "Велосипедисты"
#    n = name.strip()         
#    for l in range(1,len(n)):          beaR   
#        prefix = n[0:l]             
#        r.zadd('compl',{prefix:0})
#    r.zadd('compl',{n+"*":0})
#except:
#    print ("ERROR")
#    
#print ("OK")

# WORK
prefix = "Be"
results = []
rangelen = 50 
count=5
start = r.zrank('compl',prefix)  
if not start:
    results = []
   
while (len(results) != count):
    try:         
        range = r.zrange('compl', start, start+rangelen-1)  
        #print (range)       
        start += rangelen
        if not range or len(range) == 0:
            break
        for entry in range:
            entry = entry.decode('utf-8')
            minlen = min(len(entry),len(prefix))   
            if entry[0:minlen] != prefix[0:minlen]:    
                count = len(results)
                break              
            if entry[-1] == "*" and len(results) != count:                 
                results.append(entry[0:-1])
    except TypeError:
        break
 
print (results)
#args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:%'+results[0]+'%', 'LIMIT', '0', '5']
##args = ['ft.search', 'redis_search:myapp.ormsearch.UserDocument:index', '@username_fts:be*']
#print (RedisModel.db().execute_command(*args))
import pickle

redis = get_redis_connection()
rstr = redis.execute_command(*args)
print (dir(JsonModel))
print ("-", JsonModel.from_redis(rstr))

#
# Создание с помощью OM
#from abc import ABC
#class Post(JsonModel):#, ABC): HashModel
#    body: str
#    class Meta:
#        global_key_prefix = "redis_search"  
#        model_key_prefix = "myapp.ormsearch.PostDocument"
#        
#P = Post(body="Питон")
#P.pk = 43

#P.save()
#print (P.key())
#print (Post.get(P.pk))


#'database', 'encoding', 'global_key_prefix', 'index_name', 'model_key_prefix', 'primary_key', 'primary_key_creator_cls', 'primary_key_pattern'
#print (dir(P._meta))
#print (P._meta.index_name)
#print (P._meta.model_key_prefix)

