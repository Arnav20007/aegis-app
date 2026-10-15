from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from src.config.database import Base
from datetime import datetime
import enum

class ContactPriority(str, enum.Enum):
    Primary = "Primary"
    Secondary = "Secondary"

class AlertStatus(str, enum.Enum):
    active = "active"
    resolved = "resolved"

class ChatSender(str, enum.Enum):
    user = "user"
    operator = "operator"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    blood_type = Column(String, nullable=True)
    medical_notes = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(String, nullable=True)
    emergency_notes = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    chronic_conditions = Column(String, nullable=True)
    medications = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    contacts = relationship("Contact", back_populates="user")
    alerts = relationship("Alert", back_populates="user")

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    relation = Column(String)
    phone = Column(String)
    priority = Column(SQLEnum(ContactPriority))
    
    user = relationship("User", back_populates="contacts")

class Hazard(Base):
    __tablename__ = "hazards"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    description = Column(String)
    x = Column(Float)
    y = Column(Float)
    reported_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.active)
    last_x = Column(Float, nullable=True)
    last_y = Column(Float, nullable=True)
    
    user = relationship("User", back_populates="alerts")
    chat_messages = relationship("ChatMessage", back_populates="alert")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    sender = Column(SQLEnum(ChatSender))
    text = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    alert = relationship("Alert", back_populates="chat_messages")
