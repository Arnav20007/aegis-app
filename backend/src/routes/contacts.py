from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models import schemas, dto
from src.middleware.auth_deps import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])

@router.get("/", response_model=List[dto.ContactOut])
def get_contacts(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    contacts = db.query(schemas.Contact).filter(schemas.Contact.user_id == current_user.id).all()
    return contacts

@router.post("/", response_model=dto.ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(contact: dto.ContactCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    new_contact = schemas.Contact(
        user_id=current_user.id,
        name=contact.name,
        relation=contact.relation,
        phone=contact.phone,
        priority=contact.priority
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    contact = db.query(schemas.Contact).filter(schemas.Contact.id == contact_id, schemas.Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return None
