from django import template
from django.core.cache import cache 

register = template.Library()

@register.filter
def onlinedetect(user):
    return user.online
    
#from myapp.models import UserChannels
#@register.filter
#def onlinedetect(user):
#    try:
#        online = UserChannels.get(user).dict()["online"]
#    except Exception as e: 
#        online = False
#    return online    

