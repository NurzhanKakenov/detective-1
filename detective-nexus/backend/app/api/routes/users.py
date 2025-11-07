from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.models import User
from app.schemas.schemas import User as UserSchema, UserCreate, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserSchema)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/discord/{discord_id}", response_model=UserSchema)
async def get_user_by_discord(discord_id: str, db: Session = Depends(get_db)):
    """Get user by Discord ID"""
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/", response_model=UserSchema)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create new user"""
    # Check if discord_id already exists
    existing_user = db.query(User).filter(User.discord_id == user.discord_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this Discord ID already exists"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db)
):
    """Update existing user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}/cases")
async def get_user_cases(user_id: int, db: Session = Depends(get_db)):
    """Get all cases assigned to user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user.cases

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user has active cases
    if user.cases:
        active_cases = [case for case in user.cases if case.status == 'active']
        if active_cases:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete user with {len(active_cases)} active cases. Please reassign or close cases first."
            )
    
    # Store user info for response
    deleted_user_info = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name
    }
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return {
        "message": "User deleted successfully",
        "deleted_user": deleted_user_info
    }

@router.get("/{user_id}/notifications")
async def get_user_notifications(
    user_id: int,
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    notifications = user.notifications
    if unread_only:
        notifications = [n for n in notifications if not n.is_read]
    
    return notifications