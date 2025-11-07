from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.models.database import get_db
from app.models.models import Suspect, Case, case_suspects, Vehicle
from app.schemas.schemas import Suspect as SuspectSchema, SuspectCreate, SuspectUpdate, Vehicle as VehicleSchema, VehicleCreate, VehicleUpdate

router = APIRouter()

@router.get("/", response_model=List[SuspectSchema])
async def get_suspects(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all suspects with optional filtering"""
    query = db.query(Suspect)
    
    if search:
        query = query.filter(
            Suspect.full_name.contains(search) |
            Suspect.aliases.contains(search)
        )
    
    if status:
        query = query.filter(Suspect.status == status)
    
    if risk_level:
        query = query.filter(Suspect.risk_level == risk_level)
    
    suspects = query.offset(skip).limit(limit).all()
    return suspects

@router.get("/{suspect_id}", response_model=SuspectSchema)
async def get_suspect(suspect_id: int, db: Session = Depends(get_db)):
    """Get specific suspect by ID"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
        )
    return suspect

@router.post("/", response_model=SuspectSchema)
async def create_suspect(suspect: SuspectCreate, db: Session = Depends(get_db)):
    """Create new suspect"""
    suspect_data = suspect.model_dump()
    
    # Обрабатываем connections: если это массив, преобразуем в JSON строку
    if 'connections' in suspect_data and suspect_data['connections'] is not None:
        if isinstance(suspect_data['connections'], (list, dict)):
            suspect_data['connections'] = json.dumps(suspect_data['connections'], ensure_ascii=False)
        elif isinstance(suspect_data['connections'], str):
            # Если уже строка, проверяем что это валидный JSON
            try:
                json.loads(suspect_data['connections'])
            except json.JSONDecodeError:
                # Если не валидный JSON, преобразуем в JSON строку
                suspect_data['connections'] = json.dumps([], ensure_ascii=False)
    
    db_suspect = Suspect(**suspect_data)
    db.add(db_suspect)
    db.commit()
    db.refresh(db_suspect)
    return db_suspect

@router.put("/{suspect_id}", response_model=SuspectSchema)
async def update_suspect(
    suspect_id: int,
    suspect_update: SuspectUpdate,
    db: Session = Depends(get_db)
):
    """Update existing suspect"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
        )
    
    # Update only provided fields
    update_data = suspect_update.model_dump(exclude_unset=True)
    
    # Обрабатываем connections: если это массив, преобразуем в JSON строку
    if 'connections' in update_data and update_data['connections'] is not None:
        if isinstance(update_data['connections'], (list, dict)):
            update_data['connections'] = json.dumps(update_data['connections'], ensure_ascii=False)
        elif isinstance(update_data['connections'], str):
            # Если уже строка, проверяем что это валидный JSON
            try:
                json.loads(update_data['connections'])
            except json.JSONDecodeError:
                # Если не валидный JSON, преобразуем в JSON строку
                update_data['connections'] = json.dumps([], ensure_ascii=False)
    
    for field, value in update_data.items():
        setattr(suspect, field, value)
    
    db.commit()
    db.refresh(suspect)
    return suspect

@router.delete("/{suspect_id}")
async def delete_suspect(suspect_id: int, db: Session = Depends(get_db)):
    """Delete suspect"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
        )
    
    # Check if suspect is linked to any cases
    linked_cases = db.query(case_suspects).filter(case_suspects.c.suspect_id == suspect_id).count()
    if linked_cases > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete suspect linked to {linked_cases} case(s). Remove from cases first."
        )
    
    # Store suspect info for response
    deleted_suspect_info = {
        "id": suspect.id,
        "full_name": suspect.full_name
    }
    
    # Delete suspect
    db.delete(suspect)
    db.commit()
    
    return {
        "message": "Suspect deleted successfully",
        "deleted_suspect": deleted_suspect_info
    }

@router.get("/{suspect_id}/cases")
async def get_suspect_cases(suspect_id: int, db: Session = Depends(get_db)):
    """Get all cases linked to suspect"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
        )
    
    return suspect.cases


@router.get("/{suspect_id}/vehicles", response_model=List[VehicleSchema])
async def get_suspect_vehicles(suspect_id: int, db: Session = Depends(get_db)):
    """Get all vehicles linked to suspect"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
        )

    vehicles = db.query(Vehicle).filter(Vehicle.suspect_id == suspect_id).all()
    return vehicles


@router.post("/{suspect_id}/vehicles", response_model=VehicleSchema)
async def create_suspect_vehicle(suspect_id: int, vehicle: VehicleCreate, db: Session = Depends(get_db)):
    """Create a vehicle entry for a suspect"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
        )

    vehicle_data = vehicle.model_dump()
    db_vehicle = Vehicle(suspect_id=suspect_id, **vehicle_data)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.put("/{suspect_id}/vehicles/{vehicle_id}", response_model=VehicleSchema)
async def update_suspect_vehicle(suspect_id: int, vehicle_id: int, vehicle_update: VehicleUpdate, db: Session = Depends(get_db)):
    """Update a vehicle for a suspect"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suspect not found")

    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.suspect_id == suspect_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    update_data = vehicle_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vehicle, field, value)

    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.delete("/{suspect_id}/vehicles/{vehicle_id}")
async def delete_suspect_vehicle(suspect_id: int, vehicle_id: int, db: Session = Depends(get_db)):
    """Delete a vehicle for a suspect"""
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suspect not found")

    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.suspect_id == suspect_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    db.delete(db_vehicle)
    db.commit()

    return {"message": "Vehicle deleted successfully", "vehicle_id": vehicle_id}

@router.post("/{suspect_id}/link-case/{case_id}")
async def link_suspect_to_case(
    suspect_id: int, 
    case_id: int, 
    role_in_case: str = "suspect",
    db: Session = Depends(get_db)
):
    """Link suspect to a case"""
    # Check if suspect exists
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
        )
    
    # Check if case exists
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Check if link already exists
    existing_link = db.execute(
        case_suspects.select().where(
            (case_suspects.c.case_id == case_id) & 
            (case_suspects.c.suspect_id == suspect_id)
        )
    ).first()
    
    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Suspect is already linked to this case"
        )
    
    # Create link
    db.execute(
        case_suspects.insert().values(
            case_id=case_id,
            suspect_id=suspect_id,
            role_in_case=role_in_case
        )
    )
    db.commit()
    
    return {
        "message": "Suspect linked to case successfully",
        "suspect_id": suspect_id,
        "case_id": case_id,
        "role_in_case": role_in_case
    }

@router.delete("/{suspect_id}/unlink-case/{case_id}")
async def unlink_suspect_from_case(
    suspect_id: int, 
    case_id: int, 
    db: Session = Depends(get_db)
):
    """Unlink suspect from a case"""
    # Check if link exists
    existing_link = db.execute(
        case_suspects.select().where(
            (case_suspects.c.case_id == case_id) & 
            (case_suspects.c.suspect_id == suspect_id)
        )
    ).first()
    
    if not existing_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect is not linked to this case"
        )
    
    # Remove link
    db.execute(
        case_suspects.delete().where(
            (case_suspects.c.case_id == case_id) & 
            (case_suspects.c.suspect_id == suspect_id)
        )
    )
    db.commit()
    
    return {
        "message": "Suspect unlinked from case successfully",
        "suspect_id": suspect_id,
        "case_id": case_id
    }