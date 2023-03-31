from redis_search_django.documents import JsonDocument

from myapp.models import *

#class PostDocument(JsonDocument):
#    class Django:
#        model = Post
#        fields = ["body"]
#        auto_index = True
        
#    @classmethod
#    def get_queryset(cls) -> models.QuerySet:
#        """Override Queryset to filter out available products."""
#        return super().get_queryset().filter(available=True)
        
        
class UserDocument(JsonDocument):
    class Django:
        model = User
        fields = ["username", "path_data", "image_user"]
        auto_index = True
        
#    @classmethod
#    def get_queryset(cls) -> models.QuerySet:
#        """Override Queryset to filter out available products."""
#        return super().get_queryset().filter(is_active=True)        
