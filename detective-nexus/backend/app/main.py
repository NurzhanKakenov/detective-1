from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, cases, users, analytics, ai, evidence, suspects
from app.core.config import settings

app = FastAPI(
    title="Detective Nexus API",
    description="API для системы управления делами детективного отдела",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(cases.router, prefix="/api/cases", tags=["cases"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["evidence"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(suspects.router, prefix="/api/suspects", tags=["suspects"])

@app.get("/")
async def root():
    return {"message": "Detective Nexus API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}