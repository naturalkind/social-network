from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from collections import OrderedDict

class CustomPageNumberPagination(PageNumberPagination):
    """Пагинация с поддержкой динамического page_size"""
    page_size = 10
    page_size_query_param = 'page_size'  # ← параметр в запросе
    max_page_size = 100                   # ← лимит
    
    def get_paginated_response(self, data):
        """Добавляем текущий page_size в ответ для удобства клиента"""
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('page_size', self.page_size),  # полезно для фронтенда
        ]))
