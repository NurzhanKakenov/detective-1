from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.database import get_db
from app.models.models import Case, User, CaseStatus
from app.schemas.schemas import CaseStats, DetectiveStats
from typing import List
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/overview", response_model=CaseStats)
async def get_case_overview(db: Session = Depends(get_db)):
    """Get overall case statistics"""
    total_cases = db.query(Case).count()
    active_cases = db.query(Case).filter(Case.status == CaseStatus.ACTIVE).count()
    closed_cases = db.query(Case).filter(Case.status == CaseStatus.CLOSED).count()
    archived_cases = db.query(Case).filter(Case.status == CaseStatus.ARCHIVED).count()
    
    solve_rate = (closed_cases / total_cases * 100) if total_cases > 0 else 0
    
    return CaseStats(
        total_cases=total_cases,
        active_cases=active_cases,
        closed_cases=closed_cases,
        archived_cases=archived_cases,
        solve_rate=round(solve_rate, 2)
    )

@router.get("/detectives", response_model=List[DetectiveStats])
async def get_detective_stats(db: Session = Depends(get_db)):
    """Get statistics for all detectives"""
    stats = []
    
    detectives = db.query(User).filter(User.is_active == True).all()
    
    for detective in detectives:
        total_cases = db.query(Case).filter(Case.detective_id == detective.id).count()
        closed_cases = db.query(Case).filter(
            Case.detective_id == detective.id,
            Case.status == CaseStatus.CLOSED
        ).count()
        
        # Calculate average close time
        closed_case_times = db.query(
            func.extract('epoch', Case.closed_at - Case.created_at)
        ).filter(
            Case.detective_id == detective.id,
            Case.status == CaseStatus.CLOSED,
            Case.closed_at.isnot(None)
        ).all()
        
        avg_close_time = None
        if closed_case_times:
            avg_seconds = sum(time[0] for time in closed_case_times if time[0]) / len(closed_case_times)
            avg_close_time = round(avg_seconds / 86400, 2)  # Convert to days
        
        stats.append(DetectiveStats(
            detective_id=detective.id,
            detective_name=detective.full_name,
            total_cases=total_cases,
            closed_cases=closed_cases,
            avg_close_time=avg_close_time
        ))
    
    return stats

@router.get("/cases-by-month")
async def get_cases_by_month(db: Session = Depends(get_db)):
    """Get case creation statistics by month"""
    current_year = datetime.now().year
    
    monthly_stats = db.query(
        extract('month', Case.created_at).label('month'),
        func.count(Case.id).label('count')
    ).filter(
        extract('year', Case.created_at) == current_year
    ).group_by(
        extract('month', Case.created_at)
    ).all()
    
    # Format for frontend charts
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    result = []
    for i in range(1, 13):
        count = next((stat.count for stat in monthly_stats if stat.month == i), 0)
        result.append({
            'month': months[i-1],
            'cases': count
        })
    
    return result

@router.get("/cases-by-status")
async def get_cases_by_status(db: Session = Depends(get_db)):
    """Get case distribution by status"""
    status_stats = db.query(
        Case.status,
        func.count(Case.id).label('count')
    ).group_by(Case.status).all()
    
    return [
        {'status': stat.status.value, 'count': stat.count}
        for stat in status_stats
    ]

@router.get("/cases-by-priority")
async def get_cases_by_priority(db: Session = Depends(get_db)):
    """Get case distribution by priority"""
    priority_stats = db.query(
        Case.priority,
        func.count(Case.id).label('count')
    ).filter(Case.status == CaseStatus.ACTIVE).group_by(Case.priority).all()
    
    return [
        {'priority': stat.priority.value, 'count': stat.count}
        for stat in priority_stats
    ]

@router.get("/recent-activity")
async def get_recent_activity(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent case activity"""
    recent_cases = db.query(Case).order_by(
        Case.updated_at.desc()
    ).limit(limit).all()
    
    activity = []
    for case in recent_cases:
        activity.append({
            'case_id': case.id,
            'case_number': case.case_number,
            'title': case.title,
            'status': case.status.value,
            'detective_name': case.detective.full_name if case.detective else 'Unassigned',
            'updated_at': case.updated_at
        })
    
    return activity