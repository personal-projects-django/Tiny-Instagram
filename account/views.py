from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserRegisterSerializer
# Create your views here.


class UserRegisterView(APIView):
    serializer_class = UserRegisterSerializer
    def post(self, request):
