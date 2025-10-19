import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import pytest
import json
from django.contrib.auth.models import User
from django.test import Client
from sensors.models import Sensor, Reading
from datetime import datetime
from decimal import Decimal
from django.utils import timezone

def get_token(client, email, password):
    response = client.post('/api/auth/token/', {
        "email": email, "password": password
    }, content_type='application/json')
    return json.loads(response.content)['access']

@pytest.mark.django_db
def test_create_reading():
    """Test reading creation"""
    user = User.objects.create_user(email="test@example.com", username="test", password="test123")
    sensor = Sensor.objects.create(owner=user, name="test-sensor", model="TestModel")
    client = Client()
    token = get_token(client, "test@example.com", "test123")
    
    response = client.post(f'/api/sensors/{sensor.id}/readings/', {
        "temperature": 23.5,
        "humidity": 65.0,
        "timestamp": "2024-01-01T10:00:00Z"
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
    
    assert response.status_code == 200
    assert Reading.objects.filter(sensor=sensor).count() == 1

@pytest.mark.django_db
def test_readings_date_filter():
    """Test readings filtering by timestamp"""
    user = User.objects.create_user(email="test@example.com", username="test", password="test123")
    sensor = Sensor.objects.create(owner=user, name="test-sensor", model="TestModel")
    
    # Create readings on different dates
    Reading.objects.create(
        sensor=sensor,
        timestamp=timezone.make_aware(datetime(2024, 1, 1, 10, 0, 0)),
        temperature=Decimal('20.0'),
        humidity=Decimal('60.0')
    )
    Reading.objects.create(
        sensor=sensor,
        timestamp=timezone.make_aware(datetime(2024, 1, 2, 15, 0, 0)),
        temperature=Decimal('21.0'),
        humidity=Decimal('65.0')
    )
    Reading.objects.create(
        sensor=sensor,
        timestamp=timezone.make_aware(datetime(2024, 1, 3, 8, 0, 0)),
        temperature=Decimal('22.0'),
        humidity=Decimal('70.0')
    )
    
    client = Client()
    token = get_token(client, "test@example.com", "test123")
    
    # Test filtering
    response = client.get(
        f'/api/sensors/{sensor.id}/readings/?timestamp_from=2024-01-02T00:00:00Z',
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    data = json.loads(response.content)
    
    assert response.status_code == 200
    assert len(data['items']) == 2  
    
    response = client.get(
        f'/api/sensors/{sensor.id}/readings/?timestamp_to=2024-01-01T23:59:59Z', 
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    data = json.loads(response.content)
    
    assert response.status_code == 200
    assert len(data['items']) == 1  
    
    # Test filtering range (Jan 2nd only)
    response = client.get(
        f'/api/sensors/{sensor.id}/readings/?timestamp_from=2024-01-02T00:00:00Z&timestamp_to=2024-01-02T23:59:59Z', 
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    data = json.loads(response.content)
    
    assert response.status_code == 200
    assert len(data['items']) == 1 
    assert '2024-01-02' in data['items'][0]['timestamp']