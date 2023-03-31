from django import template

register = template.Library()

from redis_om import HashModel, JsonModel

class UserChannels(JsonModel):
    channels: str
    online: bool
    class Meta:
        global_key_prefix = "redis_channels"  
        model_key_prefix = "user"

@register.filter
def onlinedetect(user):
    try:
        online = UserChannels.get(user).dict()["online"]
    except Exception as e: 
        #print (e)  
        online = False
    return online

