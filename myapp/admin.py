from django.contrib import admin
from myapp.models import *
from privatemessages.models import *
from django.contrib.auth.admin import UserAdmin

# Register your models here.
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'id',)
    search_fields = ('title', 'id',)
    fields = ('title', 'body', 'image', 'user_post')
    
class CommentAdmin(admin.ModelAdmin):
    list_display = ('post_id', 'comment_user', 'comment_text')
    fields = ('post_id', 'comment_user', 'comment_text',)

class ThreadAdmin(admin.ModelAdmin):
    list_display = ('id', 'last_message')
    fields = ('last_message', 'participants')

class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'thread', 'text')
    fields = ('sender', 'thread', 'text')

class MediaAdmin(admin.ModelAdmin):
    list_display = ('about', 'media')
    fields = ('about', 'media')
    
class RelationshipAdmin(admin.ModelAdmin):
    list_display = ('from_person', 'to_person', 'status')
    fields = ('from_person', 'to_person', 'status')   
    
class RelikeAdmin(admin.ModelAdmin):
    list_display = ('from_post', 'to_pers', 'status')
    fields = ('from_post', 'to_pers', 'status')      

class KeystrokeAdmin(admin.ModelAdmin):
    list_display = ('text', 'id', 'user_post_key')
    search_fields = ('text', 'id', 'user_post_key')
    fields = ('text', 'user_post_key', 'pure_data', 'status', 'text_to_test')

class CustomUserAdmin(UserAdmin):
#    list_display = [field.name for field in User._meta.fields if field.name != "password"]
    list_display = ['username', 'is_superuser', 'id', 'last_login', 'image_user', 'path_data']
    fieldsets = UserAdmin.fieldsets + ((None, {'fields': ('image_user', 'path_data', 'color')}),)
    
admin.site.register(User, CustomUserAdmin)
admin.site.register(Post, PostAdmin)   
admin.site.register(Comment, CommentAdmin)
admin.site.register(Thread, ThreadAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(Media, MediaAdmin)
admin.site.register(Relationship, RelationshipAdmin)
admin.site.register(Relike, RelikeAdmin)
admin.site.register(Keystroke, KeystrokeAdmin) 
