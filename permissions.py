from rest_framework.permissions import BasePermission,SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):

    def has_permission(self, request, view):

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user

# from rest_framework.permissions import BasePermission, SAFE_METHODS
#
# class IsOwnerOrReadOnly(BasePermission):
#     """
#     مجوزی برای بررسی اینکه آیا کاربر صاحب شیء است یا نه. برای متدهای امن (مثل GET) همه می‌توانند دسترسی داشته باشند.
#     """
#     def has_permission(self, request, view):
#         # بررسی اینکه کاربر احراز هویت شده است یا خیر
#         return request.user and request.user.is_authenticated
#
#     def has_object_permission(self, request, view, obj):
#         # برای متدهای امن (GET، HEAD، OPTIONS) اجازه دسترسی به همه
#         if request.method in SAFE_METHODS:
#             return True
#         # برای متدهای غیرامن (مثل PUT یا DELETE)، فقط صاحب شیء می‌تواند دسترسی داشته باشد
#         return obj.user == request.user  # اصلاح به `obj.user`
