from ninja import NinjaAPI
from sensors.auth import auth_router
from sensors.views import sensors_router, readings_router

api = NinjaAPI()

api.add_router("/auth/", auth_router)
api.add_router("/sensors/", sensors_router)
api.add_router("/sensors/", readings_router)
