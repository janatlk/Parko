from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ProjectInfoSerializer


class ProjectInfoView(APIView):
    def get(self, request):
        data = {
            "name": "Parko API",
            "version": "1.0.0",
            "description": "Базовый API на Django REST Framework.",
            "author": "Developer",
        }
        serializer = ProjectInfoSerializer(data)
        return Response(serializer.data)
