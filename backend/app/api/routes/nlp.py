from fastapi import APIRouter, Depends, HTTPException
from app.models.request_models import SemanticSimilarityRequest, DecomposeRequest
from app.ml.semantic_model import calculate_similarity
from app.ml.linguistic_analyzer import decompose_word
from app.core.security import get_current_user

router = APIRouter()

@router.post("/semantic-similarity")
async def semantic_similarity(request: SemanticSimilarityRequest, user: dict = Depends(get_current_user)):
    try:
        score = calculate_similarity(request.sentence1, request.sentence2)
        return {
            "success": True,
            "similarity": score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/decompose")
async def decompose(request: DecomposeRequest, user: dict = Depends(get_current_user)):
    try:
        result = decompose_word(request.word)
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
