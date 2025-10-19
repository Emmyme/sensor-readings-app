import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import pytest
import json
from django.contrib.auth.models import User
from django.test import Client
from sensors.models import Sensor

def get_token(client, email, password):
    response = client.post('/api/auth/token/', {
        "email": email, "password": password
    }, content_type='application/json')
    return json.loads(response.content)['access']

@pytest.mark.django_db
def test_create_sensor():
    """Test sensor creation"""
    user = User.objects.create_user(email="test@example.com", username="test", password="test123")
    client = Client()
    token = get_token(client, "test@example.com", "test123")
    
    response = client.post('/api/sensors/', {
        "name": "test-sensor", "model": "TestModel"
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
    
    assert response.status_code == 200
    assert Sensor.objects.filter(name="test-sensor").exists()

@pytest.mark.django_db
def test_update_sensor():
    """Test sensor update"""
    user = User.objects.create_user(email="test@example.com", username="test", password="test123")
    sensor = Sensor.objects.create(owner=user, name="old", model="OldModel")
    client = Client()
    token = get_token(client, "test@example.com", "test123")
    
    response = client.put(f'/api/sensors/{sensor.id}/', {
        "name": "new"
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
    
    assert response.status_code == 200

@pytest.mark.django_db
def test_delete_sensor():
    """Test sensor deletion"""
    user = User.objects.create_user(email="test@example.com", username="test", password="test123")
    sensor = Sensor.objects.create(owner=user, name="delete-me", model="TestModel")
    client = Client()
    token = get_token(client, "test@example.com", "test123")
    
    response = client.delete(f'/api/sensors/{sensor.id}/', HTTP_AUTHORIZATION=f'Bearer {token}')
    
    assert response.status_code == 200
    assert not Sensor.objects.filter(id=sensor.id).exists()

@pytest.mark.django_db
def test_list_with_pagination():
    """Test sensor list with pagination"""
    user = User.objects.create_user(email="test@example.com", username="test", password="test123")

    for i in range(25):
        Sensor.objects.create(owner=user, name=f"sensor-{i:02d}", model="TestModel")
    
    client = Client()
    token = get_token(client, "test@example.com", "test123")
    
    # Test first page
    response = client.get('/api/sensors/', HTTP_AUTHORIZATION=f'Bearer {token}')
    data = json.loads(response.content)
    
    assert response.status_code == 200
    assert 'items' in data
    assert 'count' in data
    assert data['count'] == 25 
    
    # Test pagination
    response = client.get('/api/sensors/?page=1', HTTP_AUTHORIZATION=f'Bearer {token}')
    data = json.loads(response.content)
    
    assert response.status_code == 200
    assert len(data['items']) <= 25 
    assert data['count'] == 25
    
    first_page_count = len(data['items'])
    
    if first_page_count >= 10:
        response = client.get('/api/sensors/?page=2', HTTP_AUTHORIZATION=f'Bearer {token}')
        data_page2 = json.loads(response.content)
        
        assert response.status_code == 200
        assert data_page2['count'] == 25