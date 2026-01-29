from rest_framework import serializers

from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'slug',
            'country',
            'timezone',
            'default_language',
            'default_currency',
            'legal_name',
            'inn',
            'address',
            'phone',
            'email',
            'created_by',
            'created_at',
            'updated_at',
            'is_active',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]
