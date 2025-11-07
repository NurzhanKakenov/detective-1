from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import get_db
from app.models.models import Case, User, CaseStatus, Suspect, case_suspects, Evidence, AIAnalysis
from app.schemas.schemas import Case as CaseSchema, CaseCreate, CaseUpdate, Suspect as SuspectSchema, SuspectInCase
from pydantic import BaseModel
# from app.services.case_service import CaseService  # TODO: implement later
import uuid

router = APIRouter()

def generate_case_number() -> str:
    """Generate unique case number in format HN-YYYY-XXXX"""
    from datetime import datetime
    year = datetime.now().year
    # In production, this should check existing numbers and increment
    random_num = str(uuid.uuid4().int)[:4]
    return f"HN-{year}-{random_num}"

@router.get("/", response_model=List[CaseSchema])
async def get_cases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[CaseStatus] = None,
    detective_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all cases with optional filtering"""
    query = db.query(Case)
    
    if status:
        query = query.filter(Case.status == status)
    if detective_id:
        query = query.filter(Case.detective_id == detective_id)
    
    cases = query.offset(skip).limit(limit).all()
    return cases

@router.get("/{case_id}", response_model=CaseSchema)
async def get_case(case_id: int, db: Session = Depends(get_db)):
    """Get specific case by ID"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    return case

@router.post("/", response_model=CaseSchema)
async def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    """Create new case"""
    # Verify detective exists
    detective = db.query(User).filter(User.id == case.detective_id).first()
    if not detective:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detective not found"
        )
    
    # Create case with generated number
    db_case = Case(
        case_number=generate_case_number(),
        **case.model_dump()
    )
    
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

@router.put("/{case_id}", response_model=CaseSchema)
async def update_case(
    case_id: int,
    case_update: CaseUpdate,
    db: Session = Depends(get_db)
):
    """Update existing case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Update only provided fields
    update_data = case_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    # Set closed_at if status changed to closed
    if case_update.status == CaseStatus.CLOSED and not case.closed_at:
        from datetime import datetime
        case.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(case)
    return case

@router.delete("/{case_id}")
async def delete_case(case_id: int, db: Session = Depends(get_db)):
    """Delete case (archive it instead)"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Archive instead of delete
    case.status = CaseStatus.ARCHIVED
    db.commit()
    
    return {"message": "Case archived successfully"}


@router.delete("/{case_id}/permanent")
async def delete_case_permanent(case_id: int, db: Session = Depends(get_db)):
    """Permanently delete a case and its related records (evidence, analyses, links)."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )

    # Delete related evidence
    db.query(Evidence).filter(Evidence.case_id == case_id).delete(synchronize_session=False)

    # Delete related AI analyses
    db.query(AIAnalysis).filter(AIAnalysis.case_id == case_id).delete(synchronize_session=False)

    # Remove many-to-many links
    db.execute(case_suspects.delete().where(case_suspects.c.case_id == case_id))

    # Delete the case itself
    db.delete(case)
    db.commit()

    return {"message": "Case deleted permanently"}

@router.get("/{case_id}/evidence")
async def get_case_evidence(case_id: int, db: Session = Depends(get_db)):
    """Get all evidence for a case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    return case.evidence

@router.get("/{case_id}/suspects", response_model=List[SuspectInCase])
async def get_case_suspects(case_id: int, db: Session = Depends(get_db)):
    """Get all suspects linked to a case, include their role_in_case"""
    # Ensure case exists
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )

    # Query suspects joined with association table to get role_in_case
    results = db.query(Suspect, case_suspects.c.role_in_case).join(
        case_suspects, Suspect.id == case_suspects.c.suspect_id
    ).filter(case_suspects.c.case_id == case_id).all()

    suspects_with_role = []
    for suspect, role in results:
        suspects_with_role.append({
            "id": suspect.id,
            "full_name": suspect.full_name,
            "aliases": suspect.aliases,
            "date_of_birth": suspect.date_of_birth,
            "place_of_birth": suspect.place_of_birth,
            "nationality": suspect.nationality,
            "gender": suspect.gender,
            "height": suspect.height,
            "weight": suspect.weight,
            "eye_color": suspect.eye_color,
            "hair_color": suspect.hair_color,
            "distinguishing_marks": suspect.distinguishing_marks,
            "last_known_address": suspect.last_known_address,
            "phone_numbers": suspect.phone_numbers,
            "email_addresses": suspect.email_addresses,
            "criminal_record": suspect.criminal_record,
            "previous_arrests": suspect.previous_arrests,
            "known_associates": suspect.known_associates,
            "status": suspect.status.value if suspect.status else None,
            "risk_level": suspect.risk_level.value if suspect.risk_level else None,
            "occupation": suspect.occupation,
            "education": suspect.education,
            "notes": suspect.notes,
            "photo_url": suspect.photo_url,
            "vehicle_info": suspect.vehicle_info,
            "gang_affiliation": suspect.gang_affiliation,
            "is_informant": suspect.is_informant,
            "connections": suspect.connections,
            "created_by": suspect.created_by,
            "created_at": suspect.created_at,
            "updated_at": suspect.updated_at,
            "role_in_case": role
        })

    return suspects_with_role

@router.post("/{case_id}/suspects/{suspect_id}")
async def link_suspect_to_case(
    case_id: int,
    suspect_id: int,
    role_in_case: str = "suspect",
    db: Session = Depends(get_db)
):
    """Link a suspect to a case"""
    # Check if case exists
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Check if suspect exists
    suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suspect not found"
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
    
    # Refresh to get updated relationships
    db.refresh(case)
    db.refresh(suspect)
    
    return {
        "message": "Suspect linked to case successfully",
        "case_id": case_id,
        "suspect_id": suspect_id,
        "role_in_case": role_in_case,
        "suspect": suspect
    }

@router.delete("/{case_id}/suspects/{suspect_id}")
async def unlink_suspect_from_case(
    case_id: int,
    suspect_id: int,
    db: Session = Depends(get_db)
):
    """Unlink a suspect from a case"""
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
        "case_id": case_id,
        "suspect_id": suspect_id
    }