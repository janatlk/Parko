from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import ValidationError

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

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
from .services.demo_service import DemoSessionService


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


# Demo session views
class DemoStartView(APIView):
    """
    Create a new isolated demo session.
    Returns JWT token with demo session data.
    """
    permission_classes = (AllowAny,)
    
    def post(self, request):
        # Create demo session
        session_data = DemoSessionService.create_session()
        
        # Create JWT token with demo metadata
        refresh = RefreshToken()
        refresh['user_id'] = session_data['user_id']
        refresh['username'] = session_data['username']
        refresh['session_id'] = session_data['session_id']
        refresh['company_id'] = session_data['company_id']
        refresh['is_demo'] = True
        refresh['role'] = 'ADMIN'  # Demo has all permissions except users
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'session_id': session_data['session_id'],
            'username': session_data['username'],
            'is_demo': True,
            'company_id': session_data['company_id']
        }, status=status.HTTP_201_CREATED)


class DemoCleanupView(APIView):
    """
    Cleanup demo session data.
    Called on logout or tab close.
    """
    permission_classes = (AllowAny,)  # No auth required, just session_id in body
    
    def post(self, request):
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'session_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        DemoSessionService.cleanup_session(session_id)
        
        return Response({'status': 'cleaned'}, status=status.HTTP_200_OK)

