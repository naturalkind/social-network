import datetime
from django.conf import settings
from myapp.models import UserChannels
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
# https://stackoverflow.com/questions/29663777/how-to-check-whether-a-user-is-online-in-django-template    
# https://newbedev.com/how-to-check-whether-a-user-is-online-in-django-template    
        
class ActiveUserMiddleware(MiddlewareMixin):
    def process_request(self, request):        
        current_user = request.user
        if request.user.is_authenticated:
            now = datetime.datetime.now()
            #print ("ActiveUserMiddleware------>", current_user.username)
            cache.set('seen_%s' % (current_user.id), now, 
                           settings.USER_LASTSEEN_TIMEOUT)        
