from rest_framework import serializers
from myapp.models import Post
from django.contrib.auth.models import User


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):

        from django.core.files.base import ContentFile
        import base64
        import six
        import uuid
        from myapp.views import crop
        # Check if this is a base64 string
        if isinstance(data, six.string_types):
            # Check if the base64 string is in the "data:" format
            if 'data:' in data and ';base64,' in data:
                # Break out the header from the base64 content
                header, data = data.split(';base64,')

            # Try to decode the file. Return validation error if it fails.
            try:
                decoded_file = base64.b64decode(data)
            except TypeError:
                self.fail('invalid_image')

            # Generate file name:
            file_name = str(uuid.uuid4())[:12] # 12 characters are more than enough.

            # Get the file name extension:
            # file_extension = self.get_file_extension(file_name, decoded_file)

            # complete_file_name = "%s.%s" % (file_name, file_extension, )
            complete_file_name = "%s.png" % file_name

            data = ContentFile(decoded_file, name=complete_file_name)

            img_file = open("/Users/macbookpro/PycharmProjects/app/media/%s.png" % file_name, 'wb')
            img_file.write(decoded_file)
            img_file.close()
            crop(file_name)

        return super(Base64ImageField, self).to_internal_value(data)


class PostSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = Post
        fields = ['id','title', 'image', 'user_post', 'video', 'body']

class UserSerializer(serializers.ModelSerializer):
    us_post = PostSerializer(many=True, read_only=True)
    related_to = serializers.StringRelatedField(many=True)
    #us_post = serializers.StringRelatedField(many=True)


    class Meta:
        model = User
        fields = ['id','username', 'us_post', 'related_to']


