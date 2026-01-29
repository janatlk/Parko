from rest_framework import serializers

from .models import Accumulator, Car, CarPhoto, Fuel, Insurance, Inspection, Spare, Tires


class CarListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = [
            'id',
            'brand',
            'title',
            'numplate',
            'status',
            'driver',
        ]


class CarDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = [
            'id',
            'company',
            'region',
            'brand',
            'title',
            'numplate',
            'year',
            'vin',
            'fueltype',
            'type',
            'driver',
            'drivers_phone',
            'fuel_card',
            'status',
            'commissioned_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'company',
            'created_at',
            'updated_at',
        ]


class CarCreateUpdateSerializer(CarDetailSerializer):
    pass


class CarPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarPhoto
        fields = [
            'id',
            'car',
            'image',
            'comment',
            'uploaded_at',
        ]
        read_only_fields = [
            'id',
            'car',
            'uploaded_at',
        ]


class SpareListSerializer(serializers.ModelSerializer):
    car_numplate = serializers.CharField(source='car.numplate', read_only=True)

    class Meta:
        model = Spare
        fields = [
            'id',
            'car',
            'car_numplate',
            'title',
            'part_price',
            'job_price',
            'installed_at',
        ]
        read_only_fields = ['id', 'car_numplate']


class SpareDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spare
        fields = [
            'id',
            'car',
            'title',
            'description',
            'part_price',
            'job_description',
            'job_price',
            'installed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SpareCreateUpdateSerializer(SpareDetailSerializer):
    pass


class TiresListSerializer(serializers.ModelSerializer):
    car_numplate = serializers.CharField(source='car.numplate', read_only=True)

    class Meta:
        model = Tires
        fields = [
            'id',
            'car',
            'car_numplate',
            'model',
            'size',
            'price',
            'installed_at',
            'expires_at',
        ]
        read_only_fields = ['id', 'car_numplate']


class TiresDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tires
        fields = [
            'id',
            'car',
            'model',
            'size',
            'price',
            'photo',
            'installed_at',
            'expires_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TiresCreateUpdateSerializer(TiresDetailSerializer):
    pass


class AccumulatorListSerializer(serializers.ModelSerializer):
    car_numplate = serializers.CharField(source='car.numplate', read_only=True)

    class Meta:
        model = Accumulator
        fields = [
            'id',
            'car',
            'car_numplate',
            'model',
            'serial_number',
            'capacity',
            'price',
            'installed_at',
            'expires_at',
        ]
        read_only_fields = ['id', 'car_numplate']


class AccumulatorDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accumulator
        fields = [
            'id',
            'car',
            'model',
            'serial_number',
            'capacity',
            'price',
            'installed_at',
            'expires_at',
            'photo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AccumulatorCreateUpdateSerializer(AccumulatorDetailSerializer):
    pass


class FuelListSerializer(serializers.ModelSerializer):
    car_numplate = serializers.CharField(source='car.numplate', read_only=True)

    class Meta:
        model = Fuel
        fields = [
            'id',
            'car',
            'car_numplate',
            'year',
            'month',
            'month_name',
            'liters',
            'total_cost',
            'monthly_mileage',
            'consumption',
        ]
        read_only_fields = ['id', 'car_numplate', 'month_name', 'consumption']


class FuelDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fuel
        fields = [
            'id',
            'car',
            'year',
            'month',
            'month_name',
            'liters',
            'total_cost',
            'monthly_mileage',
            'consumption',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'month_name', 'consumption', 'created_at', 'updated_at']


class FuelCreateUpdateSerializer(FuelDetailSerializer):
    pass


class InsuranceListSerializer(serializers.ModelSerializer):
    car_numplate = serializers.CharField(source='car.numplate', read_only=True)

    class Meta:
        model = Insurance
        fields = [
            'id',
            'car',
            'car_numplate',
            'insurance_type',
            'number',
            'start_date',
            'end_date',
            'cost',
        ]
        read_only_fields = ['id', 'car_numplate']


class InsuranceDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = [
            'id',
            'car',
            'insurance_type',
            'number',
            'start_date',
            'end_date',
            'cost',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InsuranceCreateUpdateSerializer(InsuranceDetailSerializer):
    pass


class InspectionListSerializer(serializers.ModelSerializer):
    car_numplate = serializers.CharField(source='car.numplate', read_only=True)

    class Meta:
        model = Inspection
        fields = [
            'id',
            'car',
            'car_numplate',
            'number',
            'inspected_at',
            'cost',
        ]
        read_only_fields = ['id', 'car_numplate']


class InspectionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inspection
        fields = [
            'id',
            'car',
            'number',
            'inspected_at',
            'cost',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InspectionCreateUpdateSerializer(InspectionDetailSerializer):
    pass
