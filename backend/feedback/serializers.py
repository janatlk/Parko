from rest_framework import serializers
from .models import Feedback


class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'name', 'email', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            ip_address = request.META.get('REMOTE_ADDR')
            validated_data['ip_address'] = ip_address
        return super().create(validated_data)


class FeedbackListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'name', 'email', 'message', 'created_at', 'is_read']
