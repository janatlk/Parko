from rest_framework import serializers

from .models import CustomTable, CustomRecord


class CustomTableListSerializer(serializers.ModelSerializer):
    record_count = serializers.IntegerField(source='records.count', read_only=True)

    class Meta:
        model = CustomTable
        fields = [
            'id',
            'name',
            'description',
            'icon',
            'record_count',
            'created_at',
            'updated_at',
        ]


class CustomTableDetailSerializer(serializers.ModelSerializer):
    record_count = serializers.IntegerField(source='records.count', read_only=True)

    class Meta:
        model = CustomTable
        fields = [
            'id',
            'company',
            'name',
            'description',
            'icon',
            'schema',
            'record_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'company',
            'created_at',
            'updated_at',
        ]


class CustomTableCreateUpdateSerializer(CustomTableDetailSerializer):
    pass


class CustomRecordListSerializer(serializers.ModelSerializer):
    car_numplate = serializers.CharField(source='car.numplate', read_only=True)
    car_brand = serializers.CharField(source='car.brand', read_only=True)
    car_title = serializers.CharField(source='car.title', read_only=True)

    class Meta:
        model = CustomRecord
        fields = [
            'id',
            'table',
            'car',
            'car_numplate',
            'car_brand',
            'car_title',
            'data',
            'created_at',
            'updated_at',
        ]


class CustomRecordDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomRecord
        fields = [
            'id',
            'table',
            'car',
            'data',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]


class CustomRecordCreateUpdateSerializer(CustomRecordDetailSerializer):
    pass
