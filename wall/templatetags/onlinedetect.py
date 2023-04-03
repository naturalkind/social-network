from django import template
from myapp.models import UserChannels

register = template.Library()

@register.filter
def onlinedetect(user):
    try:
        online = UserChannels.get(user).dict()["online"]
    except Exception as e: 
        online = False
    return online

