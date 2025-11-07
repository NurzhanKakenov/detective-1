from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import Evidence, Case
from app.schemas.schemas import Evidence as EvidenceSchema, EvidenceCreate

router = APIRouter()

@router.get("/", response_model=List[EvidenceSchema])
async def get_all_evidence(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all evidence"""
    evidence = db.query(Evidence).offset(skip).limit(limit).all()
    return evidence

@router.get("/{evidence_id}", response_model=EvidenceSchema)
async def get_evidence(evidence_id: int, db: Session = Depends(get_db)):
    """Get specific evidence by ID"""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    return evidence

@router.post("/", response_model=EvidenceSchema)
async def create_evidence(evidence: EvidenceCreate, db: Session = Depends(get_db)):
    """Create new evidence"""
    # Verify case exists
    case = db.query(Case).filter(Case.id == evidence.case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Create evidence
    db_evidence = Evidence(
        **evidence.model_dump(),
        added_by=1  # For demo, use first user
    )
    
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    return db_evidence

@router.put("/{evidence_id}", response_model=EvidenceSchema)
async def update_evidence(
    evidence_id: int,
    evidence_update: EvidenceCreate,
    db: Session = Depends(get_db)
):
    """Update existing evidence"""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    
    # Update fields
    update_data = evidence_update.model_dump()
    for field, value in update_data.items():
        setattr(evidence, field, value)
    
    db.commit()
    db.refresh(evidence)
    return evidence

@router.delete("/{evidence_id}")
async def delete_evidence(evidence_id: int, db: Session = Depends(get_db)):
    """Delete evidence"""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    
    db.delete(evidence)
    db.commit()
    
    return {"message": "Evidence deleted successfully"}