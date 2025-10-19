import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import pytest
from django.contrib.auth.models import User
from django.test import Client

@pytest.mark.django_db
def test_register():
    """Test user registration"""
    client = Client()
    response = client.post('/api/auth/register/', {
        "email": "test@example.com",
        "username": "test", 
        "password": "test123"
    }, content_type='application/json')
    
    assert response.status_code == 200
    assert User.objects.filter(email="test@example.com").exists()

@pytest.mark.django_db  
def test_login():
    """Test user login"""
    User.objects.create_user(email="test@example.com", username="test", password="test123")
    
    client = Client()
    response = client.post('/api/auth/token/', {
        "email": "test@example.com",
        "password": "test123"
    }, content_type='application/json')
    
    assert response.status_code == 200

@pytest.mark.django_db
def test_protected_endpoint_rejection():
    """Test protected endpoint rejects unauthenticated requests"""
    client = Client()
    response = client.get('/api/sensors/')
    assert response.status_code == 401