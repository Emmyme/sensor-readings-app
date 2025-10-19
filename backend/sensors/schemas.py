from ninja import Schema
from datetime import datetime
from typing import Optional

# Auth Schemas
class UserRegisterSchema(Schema):
    email: str
    username: str
    password: str

class UserLoginSchema(Schema):
    email: str
    password: str

class TokenResponseSchema(Schema):
    access: str
    refresh: str
    user: dict

# Sensor Schemas 
class SensorIn(Schema):
    name: str
    model: str
    description: str | None = None

class SensorOut(Schema):
    id: int
    name: str
    model: str
    description: str | None = None
    readings_count: int
    last_reading_timestamp: datetime | None = None

class SensorUpdateSchema(Schema):
    name: Optional[str] = None
    model: Optional[str] = None
    description: Optional[str] = None

# Reading Schemas 
class ReadingIn(Schema):
    temperature: float
    humidity: float
    timestamp: datetime

class ReadingOut(Schema):
    id: int
    temperature: float
    humidity: float
    timestamp: datetime