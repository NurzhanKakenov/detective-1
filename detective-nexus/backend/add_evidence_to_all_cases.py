#!/usr/bin/env python3
"""
Script to add demo evidence to all cases in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.models.database import SessionLocal, engine
from app.models.models import Evidence, Case, EvidenceType
from datetime import datetime

def add_evidence_to_all_cases():
    db = SessionLocal()
    try:
        # Get all cases
        cases = db.query(Case).all()
        if not cases:
            print("No cases found.")
            return
        
        evidence_added_count = 0
        
        for case in cases:
            # Check if evidence already exists for this case
            existing_evidence = db.query(Evidence).filter(Evidence.case_id == case.id).first()
            if existing_evidence:
                print(f"Evidence already exists for case {case.case_number}")
                continue
            
            # Create demo evidence for this case
            evidence_items = [
                {
                    "case_id": case.id,
                    "evidence_type": EvidenceType.PHOTO,
                    "title": "Фотографии с места происшествия",
                    "description": f"Детальные фотографии места преступления по делу {case.case_number}",
                    "file_url": f"https://example.com/evidence/photos/{case.case_number.lower()}-photos.jpg",
                    "file_name": f"{case.case_number.lower()}-photos.jpg",
                    "chain_of_custody": f"Собрано детективом по делу {case.case_number}",
                    "added_by": case.detective_id or 1
                },
                {
                    "case_id": case.id,
                    "evidence_type": EvidenceType.DOCUMENT,
                    "title": "Протокол осмотра места происшествия",
                    "description": f"Официальный протокол осмотра по делу {case.case_number}",
                    "file_url": f"https://example.com/evidence/documents/{case.case_number.lower()}-protocol.pdf",
                    "file_name": f"{case.case_number.lower()}-protocol.pdf",
                    "chain_of_custody": f"Составлен следственной группой по делу {case.case_number}",
                    "added_by": case.detective_id or 1
                }
            ]
            
            # Add specific evidence based on crime type
            if case.crime_type == "assault":
                evidence_items.append({
                    "case_id": case.id,
                    "evidence_type": EvidenceType.DIGITAL,
                    "title": "Записи камер видеонаблюдения",
                    "description": f"Видеозаписи с камер наблюдения в районе происшествия по делу {case.case_number}",
                    "file_url": f"https://example.com/evidence/videos/{case.case_number.lower()}-surveillance.mp4",
                    "file_name": f"{case.case_number.lower()}-surveillance.mp4",
                    "chain_of_custody": f"Получено от службы безопасности по делу {case.case_number}",
                    "added_by": case.detective_id or 1
                })
            elif case.crime_type == "theft":
                evidence_items.append({
                    "case_id": case.id,
                    "evidence_type": EvidenceType.PHYSICAL,
                    "title": "Отпечатки пальцев",
                    "description": f"Отпечатки пальцев, обнаруженные на месте кражи по делу {case.case_number}",
                    "file_url": f"https://example.com/evidence/fingerprints/{case.case_number.lower()}-prints.jpg",
                    "file_name": f"{case.case_number.lower()}-prints.jpg",
                    "chain_of_custody": f"Изъято экспертом-криминалистом по делу {case.case_number}",
                    "added_by": case.detective_id or 1
                })
            elif case.crime_type == "fraud":
                evidence_items.append({
                    "case_id": case.id,
                    "evidence_type": EvidenceType.DIGITAL,
                    "title": "Банковские документы",
                    "description": f"Выписки и документы по финансовым операциям по делу {case.case_number}",
                    "file_url": f"https://example.com/evidence/financial/{case.case_number.lower()}-bank-records.pdf",
                    "file_name": f"{case.case_number.lower()}-bank-records.pdf",
                    "chain_of_custody": f"Получено по запросу от банка по делу {case.case_number}",
                    "added_by": case.detective_id or 1
                })
            
            for item in evidence_items:
                evidence = Evidence(**item)
                db.add(evidence)
                evidence_added_count += 1
            
            print(f"Added {len(evidence_items)} evidence items to case {case.case_number}")
        
        db.commit()
        print(f"Successfully added {evidence_added_count} total evidence items to {len(cases)} cases")
        
    except Exception as e:
        print(f"Error adding evidence: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_evidence_to_all_cases()