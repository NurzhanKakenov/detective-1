from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, CaseStatus, CasePriority, EvidenceType, SuspectStatus, SuspectRiskLevel

# User schemas
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: str
    rank: str = "Детектив"
    department: str = "Detective Division"
    badge_number: str

class UserCreate(UserBase):
    discord_id: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    rank: Optional[str] = None  # Changed from UserRole to str for flexibility
    department: Optional[str] = None
    badge_number: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    discord_id: str
    hire_date: datetime
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Case schemas
class CaseBase(BaseModel):
    title: str
    description: str
    crime_type: str
    location: str
    priority: CasePriority = CasePriority.MEDIUM
    suspect_info: Optional[str] = None
    victim_info: Optional[str] = None

class CaseCreate(CaseBase):
    detective_id: int

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    crime_type: Optional[str] = None
    location: Optional[str] = None
    suspect_info: Optional[str] = None
    victim_info: Optional[str] = None

class Case(CaseBase):
    id: int
    case_number: str
    status: CaseStatus
    detective_id: int
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Evidence schemas
class EvidenceBase(BaseModel):
    evidence_type: EvidenceType
    title: str
    description: str
    chain_of_custody: Optional[str] = None

class EvidenceCreate(EvidenceBase):
    case_id: int

class Evidence(EvidenceBase):
    id: int
    case_id: int
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    added_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Journal schemas
class JournalEntryBase(BaseModel):
    shift_date: datetime
    title: str
    notes: str

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: str

class NotificationCreate(NotificationBase):
    user_id: int
    related_case_id: Optional[int] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    related_case_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics schemas
class CaseStats(BaseModel):
    total_cases: int
    active_cases: int
    closed_cases: int
    archived_cases: int
    solve_rate: float

class DetectiveStats(BaseModel):
    detective_id: int
    detective_name: str
    total_cases: int
    closed_cases: int
    avg_close_time: Optional[float] = None

# Suspect schemas
class SuspectBase(BaseModel):
    full_name: str
    aliases: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    place_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eye_color: Optional[str] = None
    hair_color: Optional[str] = None
    distinguishing_marks: Optional[str] = None
    last_known_address: Optional[str] = None
    phone_numbers: Optional[str] = None
    email_addresses: Optional[str] = None
    criminal_record: Optional[str] = None
    previous_arrests: Optional[str] = None
    known_associates: Optional[str] = None
    status: SuspectStatus = SuspectStatus.active
    risk_level: SuspectRiskLevel = SuspectRiskLevel.medium
    occupation: Optional[str] = None
    education: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    # New fields
    vehicle_info: Optional[str] = None
    gang_affiliation: Optional[str] = None
    is_informant: Optional[bool] = False
    connections: Optional[str] = None  # JSON string

class SuspectCreate(SuspectBase):
    created_by: int

class SuspectUpdate(BaseModel):
    full_name: Optional[str] = None
    aliases: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    place_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eye_color: Optional[str] = None
    hair_color: Optional[str] = None
    distinguishing_marks: Optional[str] = None
    last_known_address: Optional[str] = None
    phone_numbers: Optional[str] = None
    email_addresses: Optional[str] = None
    criminal_record: Optional[str] = None
    previous_arrests: Optional[str] = None
    known_associates: Optional[str] = None
    status: Optional[SuspectStatus] = None
    risk_level: Optional[SuspectRiskLevel] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    # New fields
    vehicle_info: Optional[str] = None
    gang_affiliation: Optional[str] = None
    is_informant: Optional[bool] = None
    connections: Optional[str] = None  # JSON string

class Suspect(SuspectBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Suspect with role in a case
class SuspectInCase(Suspect):
    role_in_case: Optional[str] = 'suspect'

    class Config:
        from_attributes = True

# Vehicle schemas
class VehicleBase(BaseModel):
    make: Optional[str] = None
    color: Optional[str] = None
    owner: Optional[str] = None
    plate: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class Vehicle(VehicleBase):
    id: int
    suspect_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    color: Optional[str] = None
    owner: Optional[str] = None
    plate: Optional[str] = None