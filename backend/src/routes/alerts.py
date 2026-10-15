from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models import schemas, dto
from src.middleware.auth_deps import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.post("/trigger", response_model=dto.AlertOut, status_code=status.HTTP_201_CREATED)
def trigger_alert(alert_data: dto.AlertTrigger, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    # Check if there is already an active alert for this user
    active_alert = db.query(schemas.Alert).filter(
        schemas.Alert.user_id == current_user.id, 
        schemas.Alert.status == schemas.AlertStatus.active
    ).first()
    
    if active_alert:
        # Update coordinates of existing alert
        active_alert.last_x = alert_data.x
        active_alert.last_y = alert_data.y
        db.commit()
        db.refresh(active_alert)
        return active_alert

    new_alert = schemas.Alert(
        user_id=current_user.id,
        last_x=alert_data.x,
        last_y=alert_data.y
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@router.post("/resolve/{alert_id}", response_model=dto.AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    # Note: Operators or the user themselves could resolve it. For now, checking if user owns it.
    alert = db.query(schemas.Alert).filter(schemas.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = schemas.AlertStatus.resolved
    alert.end_time = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert

@router.get("/active", response_model=List[dto.AlertOut])
def get_active_alerts(db: Session = Depends(get_db)):
    # This endpoint is primarily for the Responder Dashboard to see all active alerts globally
    alerts = db.query(schemas.Alert).filter(schemas.Alert.status == schemas.AlertStatus.active).all()
    return alerts

@router.get("/my", response_model=List[dto.AlertOut])
def get_my_alerts(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    alerts = db.query(schemas.Alert).filter(schemas.Alert.user_id == current_user.id).order_by(schemas.Alert.start_time.desc()).all()
    return alerts

@router.get("/{alert_id}/messages", response_model=List[dto.ChatMessageOut])
def get_alert_messages(alert_id: int, db: Session = Depends(get_db)):
    messages = db.query(schemas.ChatMessage).filter(schemas.ChatMessage.alert_id == alert_id).order_by(schemas.ChatMessage.timestamp.asc()).all()
    return messages
