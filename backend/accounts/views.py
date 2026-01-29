from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import ValidationError

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.permissions import IsCompanyAdmin
from core.viewsets import CompanyScopedModelViewSet

from .models import User
from .serializers import (
    LoginSerializer,
    LogoutSerializer,
    MeUpdateSerializer,
    UserCreateUpdateSerializer,
    UserDetailSerializer,
    UserListSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer


class RefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserDetailSerializer(request.user).data)

    def patch(self, request):
        serializer = MeUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserDetailSerializer(request.user).data)


class UserViewSet(CompanyScopedModelViewSet):
    queryset = User.objects.all()
    permission_classes = (IsCompanyAdmin,)

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

    def perform_update(self, serializer):
        if 'company' in serializer.validated_data and serializer.validated_data['company'] != self.request.user.company:
            raise ValidationError({'company': 'Changing company is not allowed'})
        serializer.save(company=self.request.user.company)
