import pytest
import os
import django
from django.conf import settings
from django.test.utils import get_runner

def pytest_configure(config):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()