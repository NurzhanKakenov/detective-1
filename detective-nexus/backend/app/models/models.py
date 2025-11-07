from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.database import Base
import enum

# Association table for many-to-many relationship between cases and suspects
case_suspects = Table(
    'case_suspects',
    Base.metadata,
    Column('case_id', Integer, ForeignKey('cases.id'), primary_key=True),
    Column('suspect_id', Integer, ForeignKey('suspects.id'), primary_key=True),
    Column('role_in_case', String, default='suspect'),  # suspect, witness, person_of_interest
    Column('added_at', DateTime, default=func.now())
)

class UserRole(str, enum.Enum):
    DETECTIVE = "detective"
    SERGEANT = "sergeant"
    LIEUTENANT = "lieutenant"
    CAPTAIN = "captain"
    ADMIN = "admin"

class CaseStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"
    DRAFT = "draft"

class CasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class EvidenceType(str, enum.Enum):
    DOCUMENT = "document"
    PHOTO = "photo"
    VIDEO = "video"
    AUDIO = "audio"
    PHYSICAL = "physical"
    DIGITAL = "digital"

class SuspectStatus(str, enum.Enum):
    active = "active"
    arrested = "arrested"
    cleared = "cleared"
    deceased = "deceased"
    unknown = "unknown"

class SuspectRiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    extreme = "extreme"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    discord_id = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String)
    rank = Column(String, default="Детектив")
    department = Column(String, default="Detective Division")
    badge_number = Column(String, unique=True)
    hire_date = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    cases = relationship("Case", back_populates="detective")
    evidence_added = relationship("Evidence", back_populates="added_by_user")
    journal_entries = relationship("PersonalJournal", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    status = Column(Enum(CaseStatus), default=CaseStatus.ACTIVE)
    priority = Column(Enum(CasePriority), default=CasePriority.MEDIUM)
    crime_type = Column(String)
    location = Column(String)
    suspect_info = Column(Text, nullable=True)
    victim_info = Column(Text, nullable=True)
    detective_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime, nullable=True)
    
    # Relationships
    detective = relationship("User", back_populates="cases")
    evidence = relationship("Evidence", back_populates="case")
    ai_analyses = relationship("AIAnalysis", back_populates="case")
    suspects = relationship("Suspect", secondary=case_suspects, back_populates="cases")

class Suspect(Base):
    __tablename__ = "suspects"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    aliases = Column(Text, nullable=True)  # JSON array of known aliases
    date_of_birth = Column(DateTime, nullable=True)
    place_of_birth = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    height = Column(String, nullable=True)  # e.g., "180 cm"
    weight = Column(String, nullable=True)  # e.g., "75 kg"
    eye_color = Column(String, nullable=True)
    hair_color = Column(String, nullable=True)
    distinguishing_marks = Column(Text, nullable=True)
    
    # Contact and location info
    last_known_address = Column(Text, nullable=True)
    phone_numbers = Column(Text, nullable=True)  # JSON array
    email_addresses = Column(Text, nullable=True)  # JSON array
    
    # Criminal history
    criminal_record = Column(Text, nullable=True)
    previous_arrests = Column(Text, nullable=True)  # JSON array
    known_associates = Column(Text, nullable=True)  # JSON array
    
    # Status and risk
    status = Column(Enum(SuspectStatus), default=SuspectStatus.active)
    risk_level = Column(Enum(SuspectRiskLevel), default=SuspectRiskLevel.medium)
    
    # Additional info
    occupation = Column(String, nullable=True)
    education = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)
    
    # New fields
    vehicle_info = Column(Text, nullable=True)  # Vehicle information
    gang_affiliation = Column(Text, nullable=True)  # Gang/group affiliation
    is_informant = Column(Boolean, default=False)  # Informant status
    connections = Column(Text, nullable=True)  # JSON array of connections
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    cases = relationship("Case", secondary=case_suspects, back_populates="suspects")
    created_by_user = relationship("User")
    # Vehicles relationship (one-to-many)
    vehicles = relationship("Vehicle", back_populates="suspect", cascade="all, delete-orphan")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    suspect_id = Column(Integer, ForeignKey("suspects.id"), nullable=False)
    make = Column(String, nullable=True)  # Марка
    color = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    plate = Column(String, nullable=True)  # Номера
    created_at = Column(DateTime, default=func.now())

    # Relationships
    suspect = relationship("Suspect", back_populates="vehicles")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    evidence_type = Column(Enum(EvidenceType))
    title = Column(String)
    description = Column(Text)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    chain_of_custody = Column(Text, nullable=True)
    added_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    case = relationship("Case", back_populates="evidence")
    added_by_user = relationship("User", back_populates="evidence_added")

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    analysis_type = Column(String)  # "similarity", "charge_prediction", "priority"
    result = Column(Text)
    confidence = Column(Float, nullable=True)
    analysis_metadata = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    case = relationship("Case", back_populates="ai_analyses")

class PersonalJournal(Base):
    __tablename__ = "personal_journals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    shift_date = Column(DateTime)
    title = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="journal_entries")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(Text)
    notification_type = Column(String)  # "case_assigned", "deadline", "ai_suggestion"
    is_read = Column(Boolean, default=False)
    related_case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")