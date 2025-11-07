"""
AI Analysis API Routes - DEMO VERSION

⚠️  ВАЖНО: Это демо-версия AI модуля!
    - Все функции используют mock-данные
    - Реальная AI интеграция планируется в следующих версиях
    - Для production потребуется подключение Ollama/OpenAI
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Case, AIAnalysis
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class AIAnalysisRequest(BaseModel):
    case_id: int
    analysis_type: str  # "similarity", "charge_prediction", "priority"

class AIAnalysisResponse(BaseModel):
    analysis_type: str
    result: str
    confidence: Optional[float] = None
    suggestions: List[str] = []

class ChargePredictionResponse(BaseModel):
    predicted_charge: str
    confidence: float
    alternative_charges: List[str] = []
    reasoning: str

@router.post("/analyze-case", response_model=AIAnalysisResponse)
async def analyze_case(
    request: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze case using AI (DEMO VERSION)
    
    🚧 Демо-функция: использует mock-данные для демонстрации интерфейса
    """
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Mock AI analysis for now
    if request.analysis_type == "similarity":
        result = await find_similar_cases(case, db)
    elif request.analysis_type == "charge_prediction":
        result = await predict_charges(case)
    elif request.analysis_type == "priority":
        result = await analyze_priority(case)
    else:
        raise HTTPException(status_code=400, detail="Invalid analysis type")
    
    # Save analysis to database
    ai_analysis = AIAnalysis(
        case_id=case.id,
        analysis_type=request.analysis_type,
        result=result["result"],
        confidence=result.get("confidence")
    )
    db.add(ai_analysis)
    db.commit()
    
    return AIAnalysisResponse(**result)

async def find_similar_cases(case: Case, db: Session) -> dict:
    """
    Find similar cases based on description and crime type (DEMO)
    
    🚧 Mock implementation - в production версии будет использоваться:
    - Vector similarity search
    - Semantic analysis
    - Machine learning models
    """
    similar_cases = db.query(Case).filter(
        Case.crime_type == case.crime_type,
        Case.id != case.id
    ).limit(3).all()
    
    suggestions = []
    for similar_case in similar_cases:
        suggestions.append(f"Case {similar_case.case_number}: {similar_case.title}")
    
    return {
        "analysis_type": "similarity",
        "result": f"Found {len(similar_cases)} similar cases",
        "confidence": 0.85,
        "suggestions": suggestions
    }

async def predict_charges(case: Case) -> dict:
    """
    Predict charges based on case details (DEMO)
    
    🚧 Mock charge prediction - в production версии будет:
    - Анализ юридических прецедентов
    - ML модели для предсказания статей
    - Интеграция с правовыми базами данных
    """
    crime_type_charges = {
        "theft": "Кража (статья 158 УК РФ)",
        "assault": "Побои (статья 116 УК РФ)",
        "fraud": "Мошенничество (статья 159 УК РФ)",
        "burglary": "Кража с незаконным проникновением (статья 158 ч.3 УК РФ)",
        "drug_possession": "Незаконное хранение наркотиков (статья 228 УК РФ)"
    }
    
    predicted_charge = crime_type_charges.get(
        case.crime_type.lower(),
        "Требуется дополнительный анализ"
    )
    
    return {
        "analysis_type": "charge_prediction",
        "result": predicted_charge,
        "confidence": 0.92,
        "suggestions": [
            "Рекомендуется собрать дополнительные доказательства",
            "Проверить наличие отягчающих обстоятельств"
        ]
    }

async def analyze_priority(case: Case) -> dict:
    """
    Analyze and suggest case priority (DEMO)
    
    🚧 Mock priority analysis - в production версии будет:
    - Анализ срочности по множественным факторам
    - Предсказание временных рамок
    - Оценка ресурсов и сложности
    """
    high_priority_keywords = ["urgent", "weapon", "violence", "threat"]
    description_lower = case.description.lower()
    
    priority_score = 0
    for keyword in high_priority_keywords:
        if keyword in description_lower:
            priority_score += 1
    
    if priority_score >= 2:
        suggested_priority = "HIGH"
        confidence = 0.88
    elif priority_score == 1:
        suggested_priority = "MEDIUM"
        confidence = 0.75
    else:
        suggested_priority = "LOW"
        confidence = 0.65
    
    return {
        "analysis_type": "priority",
        "result": f"Рекомендуемый приоритет: {suggested_priority}",
        "confidence": confidence,
        "suggestions": [
            f"Обнаружено {priority_score} ключевых слов высокого приоритета",
            "Рекомендуется пересмотреть приоритет дела"
        ]
    }

@router.get("/case/{case_id}/analyses")
async def get_case_analyses(case_id: int, db: Session = Depends(get_db)):
    """Get all AI analyses for a case"""
    analyses = db.query(AIAnalysis).filter(AIAnalysis.case_id == case_id).all()
    return analyses

@router.post("/predict-charges", response_model=ChargePredictionResponse)
async def predict_case_charges(case_id: int, db: Session = Depends(get_db)):
    """Get detailed charge prediction for a case"""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Enhanced charge prediction
    result = await predict_charges(case)
    
    return ChargePredictionResponse(
        predicted_charge=result["result"],
        confidence=result["confidence"],
        alternative_charges=[
            "Альтернативная статья 1",
            "Альтернативная статья 2"
        ],
        reasoning="Анализ основан на описании дела и типе преступления"
    )