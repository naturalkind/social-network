from django.contrib import admin
from myapp.models import *
from privatemessages.models import *

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

admin.site.register(User)
admin.site.register(Post, PostAdmin)   
admin.site.register(Comment, CommentAdmin)
admin.site.register(Thread, ThreadAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(Media, MediaAdmin)
