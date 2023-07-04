import datetime, json
from django.conf import settings
#from myapp.models import UserChannels
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache

#class ActiveUserMiddleware(MiddlewareMixin):
#    def process_request(self, request):
#        current_user = request.user
#        print ("------", current_user)
#        P = UserChannels(channels="", online=True)
#        P.pk = str(current_user.id)
#        P.save()

#class ActiveUserMiddleware(object):
#    def __init__(self, get_response):
#            self.get_response = get_response
#    def __call__(self, request):
#        print ("------", request.user)
#        current_user = request.user
#        P = UserChannels(channels="", online=True)
#        P.pk = str(current_user.id)
#        P.save()
#        return self.get_response(request)

 
from django.contrib import messages
from redis import StrictRedis
# Gets all notifications for a user, you can sort them based on a key like "date" in Frontend
def get_notifications(user_id):
    r = StrictRedis(host='localhost', port=6379, decode_responses=True)
    return r.hgetall('%s_notifications' % user_id)

class ActiveUserMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        current_user = request.user
        if request.user.is_authenticated:
            all_list = get_notifications(current_user.id)
            response.set_cookie('notifications', len(all_list))
        return response

    def process_request(self, request):        
        current_user = request.user
        if request.user.is_authenticated:
            now = datetime.datetime.now()
            #print ("ActiveUserMiddleware------>", current_user.username)
            cache.set('seen_%s' % (current_user.id), now, 
                           settings.USER_LASTSEEN_TIMEOUT)   
            
                
#            msgs = messages.get_messages(request)  
#            for i in msgs:
#                print ("MESSAGE INFO", i)  
#            messages.add_message(request, messages.INFO, all_list)
            
#            print ("ActiveUserMiddleware------>", UserChannels.get(current_user.id).dict())
