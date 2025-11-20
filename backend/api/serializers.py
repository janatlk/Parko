from rest_framework import serializers


class ProjectInfoSerializer(serializers.Serializer):
    name = serializers.CharField()
    version = serializers.CharField()
    description = serializers.CharField()
    author = serializers.CharField()
