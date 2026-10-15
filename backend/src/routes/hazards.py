from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models import schemas, dto

router = APIRouter(prefix="/api/hazards", tags=["Hazards"])

@router.get("/", response_model=List[dto.HazardOut])
def get_hazards(db: Session = Depends(get_db)):
    # Returns all hazards for the community map
    hazards = db.query(schemas.Hazard).order_by(schemas.Hazard.reported_at.desc()).limit(100).all()
    return hazards

@router.post("/", response_model=dto.HazardOut, status_code=201)
def create_hazard(hazard: dto.HazardCreate, db: Session = Depends(get_db)):
    # Hazards are community driven, we might not mandate auth just to report, 
    # but could optionally link to user if we wanted.
    new_hazard = schemas.Hazard(
        category=hazard.category,
        description=hazard.description,
        x=hazard.x,
        y=hazard.y
    )
    db.add(new_hazard)
    db.commit()
    db.refresh(new_hazard)
    return new_hazard
