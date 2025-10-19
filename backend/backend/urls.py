from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from sensors.views import sensors_router, readings_router
from sensors.auth import auth_router

api = NinjaAPI(title="Sensor Management API", version="1.0.0")

api.add_router("/auth", auth_router)
api.add_router("/sensors", sensors_router)
api.add_router("/sensors", readings_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]