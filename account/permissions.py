from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """فقط صاحب آبجکت می‌تونه ویرایش کنه"""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user


class IsOwner(BasePermission):
    """فقط صاحب آبجکت دسترسی داره"""
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsVerified(BasePermission):
    """فقط کاربران تأیید شده"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_verified