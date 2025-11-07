#!/usr/bin/env python3
"""
Script to add demo evidence to the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.models.database import SessionLocal, engine
from app.models.models import Evidence, Case, EvidenceType
from datetime import datetime

def add_demo_evidence():
    db = SessionLocal()
    try:
        # Get first case
        case = db.query(Case).first()
        if not case:
            print("No cases found. Please create a case first.")
            return
        
        # Check if evidence already exists
        existing_evidence = db.query(Evidence).filter(Evidence.case_id == case.id).first()
        if existing_evidence:
            print("Evidence already exists for this case.")
            return
        
        # Create demo evidence
        evidence_items = [
            {
                "case_id": case.id,
                "evidence_type": EvidenceType.PHOTO,
                "title": "Фотографии с места происшествия",
                "description": "Детальные фотографии места преступления, включая следы и улики",
                "file_url": "https://example.com/evidence/photos/crime-scene-001.jpg",
                "file_name": "crime-scene-001.jpg",
                "chain_of_custody": "Собрано детективом Смитом 06.11.2025",
                "added_by": 1
            },
            {
                "case_id": case.id,
                "evidence_type": EvidenceType.DOCUMENT,
                "title": "Показания свидетеля",
                "description": "Письменные показания очевидца происшествия",
                "file_url": "https://example.com/evidence/documents/witness-statement-001.pdf",
                "file_name": "witness-statement-001.pdf",
                "chain_of_custody": "Записано детективом Джонсоном 06.11.2025",
                "added_by": 1
            },
            {
                "case_id": case.id,
                "evidence_type": EvidenceType.DIGITAL,
                "title": "Записи камер видеонаблюдения",
                "description": "Видеозаписи с камер наблюдения в районе происшествия",
                "file_url": "https://example.com/evidence/videos/surveillance-001.mp4",
                "file_name": "surveillance-001.mp4",
                "chain_of_custody": "Получено от службы безопасности 06.11.2025",
                "added_by": 1
            }
        ]
        
        for item in evidence_items:
            evidence = Evidence(**item)
            db.add(evidence)
        
        db.commit()
        print(f"Successfully added {len(evidence_items)} evidence items to case {case.case_number}")
        
    except Exception as e:
        print(f"Error adding evidence: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_demo_evidence()