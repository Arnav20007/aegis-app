from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .schemas import ContactPriority, AlertStatus, ChatSender

# --- Users ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    blood_type: Optional[str] = None
    medical_notes: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_notes: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    medications: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    blood_type: Optional[str] = None
    medical_notes: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_notes: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    medications: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    blood_type: Optional[str] = None
    medical_notes: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_notes: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    medications: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Contacts ---
class ContactCreate(BaseModel):
    name: str
    relation: str
    phone: str
    priority: ContactPriority

class ContactOut(ContactCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Hazards ---
class HazardCreate(BaseModel):
    category: str
    description: str
    x: float
    y: float

class HazardOut(HazardCreate):
    id: int
    reported_at: datetime

    class Config:
        from_attributes = True

# --- Alerts ---
class AlertTrigger(BaseModel):
    x: float
    y: float

class AlertOut(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    status: AlertStatus
    last_x: Optional[float] = None
    last_y: Optional[float] = None

    class Config:
        from_attributes = True

# --- Chat Messages ---
class ChatMessageOut(BaseModel):
    id: int
    alert_id: int
    sender: ChatSender
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
