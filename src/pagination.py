from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size             = 12
    page_size_query_param = 'page_size'
    max_page_size         = 50


class FeedPagination(PageNumberPagination):
    page_size             = 10
    page_size_query_param = 'page_size'
    max_page_size         = 30


class ChatPagination(PageNumberPagination):
    page_size             = 30
    page_size_query_param = 'page_size'
    max_page_size         = 100