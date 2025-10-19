from typing import List, Optional, Union
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max
from ninja import Router, Query
from ninja.pagination import paginate, PageNumberPagination
from django.http import JsonResponse
from .models import Sensor, Reading
from .schemas import SensorIn, SensorOut, SensorUpdateSchema, ReadingIn, ReadingOut
from .query_schemas import SensorListQuery, ReadingListQuery
from .auth import jwt_auth
from datetime import datetime

sensors_router = Router()
readings_router = Router()

@sensors_router.get("/", response=List[SensorOut], auth=jwt_auth)
@paginate(PageNumberPagination, page_size=6)
def list_sensors(request, query: SensorListQuery = Query()):
    
    queryset = Sensor.objects.filter(owner=request.auth).annotate(
        readings_count=Count('readings'),
        last_reading_timestamp=Max('readings__timestamp')
    )
    
    if query.q:
        queryset = queryset.filter(
            Q(name__icontains=query.q) | Q(model__icontains=query.q)
        )
    
    if query.model:
        queryset = queryset.filter(model__icontains=query.model)
    
    # Handle sorting
    valid_sort_fields = [
        'name', 'model', 'readings_count', '-readings_count',
        'last_reading_timestamp', '-last_reading_timestamp'
    ]
    if query.sort_by in valid_sort_fields:
        queryset = queryset.order_by(query.sort_by)
    else:
        queryset = queryset.order_by('name')
    
    return queryset

@sensors_router.get("/models/", auth=jwt_auth)
def get_available_models(request):
    """Get list of unique sensor models for the authenticated user"""
    models = Sensor.objects.filter(owner=request.auth).values_list('model', flat=True).distinct()
    models_list = [model for model in models if model]
    return JsonResponse(models_list, safe=False)

@sensors_router.post("/", response=SensorOut, auth=jwt_auth)
def create_sensor(request, data: SensorIn):
    sensor = Sensor.objects.create(
        owner=request.auth,
        name=data.name,
        model=data.model,
        description=data.description or ""
    )
    sensor.readings_count = 0
    return sensor

@sensors_router.get("/{sensor_id}/", response=SensorOut, auth=jwt_auth)
def get_sensor(request, sensor_id: int):
    sensor = get_object_or_404(
        Sensor.objects.annotate(readings_count=Count('readings')),
        id=sensor_id,
        owner=request.auth
    )
    return sensor

@sensors_router.put("/{sensor_id}/", response=SensorOut, auth=jwt_auth)
def update_sensor(request, sensor_id: int, data: SensorUpdateSchema):
    sensor = get_object_or_404(Sensor, id=sensor_id, owner=request.auth)
    
    update_fields = data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(sensor, field, value)
    
    sensor.save()
    sensor.readings_count = sensor.readings.count()
    return sensor

@sensors_router.delete("/{sensor_id}/", auth=jwt_auth)
def delete_sensor(request, sensor_id: int):
    sensor = get_object_or_404(Sensor, id=sensor_id, owner=request.auth)
    sensor.delete()
    return {"message": "Sensor deleted successfully"}

@readings_router.get("/{sensor_id}/readings/", response=List[ReadingOut], auth=jwt_auth)
@paginate(PageNumberPagination, page_size=50)
def list_readings(
    request, 
    sensor_id: int,
    query: ReadingListQuery = Query()
):
    sensor = get_object_or_404(Sensor, id=sensor_id, owner=request.auth)
    queryset = Reading.objects.filter(sensor=sensor)
    
    if query.timestamp_from:
        queryset = queryset.filter(timestamp__gte=query.timestamp_from)
    if query.timestamp_to:
        queryset = queryset.filter(timestamp__lte=query.timestamp_to)
    
    return queryset

@readings_router.post("/{sensor_id}/readings/", response=ReadingOut, auth=jwt_auth)
def create_reading(request, sensor_id: int, data: ReadingIn):
    sensor = get_object_or_404(Sensor, id=sensor_id, owner=request.auth)
    
    reading = Reading.objects.create(
        sensor=sensor,
        temperature=data.temperature,
        humidity=data.humidity,
        timestamp=data.timestamp
    )
    
    return reading
