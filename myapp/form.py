#-*- coding: utf-8 -*-
from django.forms import ModelForm, Textarea, forms
from django.forms.extras.widgets import SelectDateWidget
from myapp.models import Post
from datetime import datetime
from django.contrib.auth.models import *


class PostForm(ModelForm):
    class Meta:
        model = Post
        fields = ['title', 'body', 'image', ]
        widgets = { 'body': Textarea(attrs={'cols': 80, 'rows': 20}),
                    'date':SelectDateWidget(years=range(datetime.now().year+1)),
                    'year':SelectDateWidget(years=range(1930,datetime.now().year+1)), }


