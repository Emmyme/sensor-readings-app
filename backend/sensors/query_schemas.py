from ninja import Schema
from typing import Optional
from datetime import datetime

class SensorListQuery(Schema):
    q: Optional[str] = None
    model: Optional[str] = None
    sort_by: Optional[str] = "name"

class ReadingListQuery(Schema):
    timestamp_from: Optional[datetime] = None
    timestamp_to: Optional[datetime] = None