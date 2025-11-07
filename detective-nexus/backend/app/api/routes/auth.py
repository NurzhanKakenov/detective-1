from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import User
from app.schemas.schemas import User as UserSchema
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()

class LoginRequest(BaseModel):
    discord_id: str
    username: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Simple login with Discord ID"""
    user = db.query(User).filter(User.discord_id == login_data.discord_id).first()
    
    if not user:
        # Create new user if doesn't exist
        user = User(
            discord_id=login_data.discord_id,
            username=login_data.username,
            full_name=login_data.username,
            badge_number=f"BADGE-{login_data.discord_id[-4:]}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # For now, return a simple token (in production, use proper JWT)
    token = f"token_{user.id}_{user.discord_id}"
    
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserSchema)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user from token"""
    token = credentials.credentials
    
    # Simple token parsing (improve in production)
    try:
        parts = token.split("_")
        if len(parts) >= 3 and parts[0] == "token":
            user_id = int(parts[1])
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
    except:
        pass
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token"
    )

@router.post("/logout")
async def logout():
    """Logout user"""
    return {"message": "Logged out successfully"}