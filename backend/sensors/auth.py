from ninja import Router
from ninja.security import HttpBearer
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import jwt
import datetime
from django.conf import settings
from .schemas import UserRegisterSchema, UserLoginSchema, TokenResponseSchema

auth_router = Router()

class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            if user_id:
                user = User.objects.get(id=user_id)
                return user
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return None

jwt_auth = JWTAuth()

def create_tokens(user):
    """Create access and refresh tokens for user"""
    access_payload = {
        'user_id': user.id,
        'type': 'access',
        'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
    }
    
    refresh_payload = {
        'user_id': user.id,
        'type': 'refresh',
        'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)
    }
    
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    
    return access_token, refresh_token

@auth_router.post("/register/", response=TokenResponseSchema)
def register(request, data: UserRegisterSchema):
    if User.objects.filter(email=data.email).exists():
        return 400, {"detail": "Email already registered"}
    
    if User.objects.filter(username=data.username).exists():
        return 400, {"detail": "Username already taken"}
    
    user = User.objects.create_user(
        email=data.email,
        username=data.username,
        password=data.password
    )
    
    access_token, refresh_token = create_tokens(user)
    
    return {
        "access": access_token,
        "refresh": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    }

@auth_router.post("/token/", response=TokenResponseSchema)
def login(request, data: UserLoginSchema):
    try:
        user = User.objects.get(email=data.email)
        if user.check_password(data.password):
            access_token, refresh_token = create_tokens(user)
            return {
                "access": access_token,
                "refresh": refresh_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username
                }
            }
    except User.DoesNotExist:
        pass
    
    return 401, {"detail": "Invalid credentials"}

@auth_router.post("/refresh/")
def refresh_token(request, refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('type') != 'refresh':
            return 401, {"detail": "Invalid token type"}
            
        user = User.objects.get(id=payload.get('user_id'))
        access_token, _ = create_tokens(user)
        
        return {"access": access_token}
    except (jwt.InvalidTokenError, User.DoesNotExist):
        return 401, {"detail": "Invalid refresh token"}