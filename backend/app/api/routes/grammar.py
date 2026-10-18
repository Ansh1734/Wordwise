from fastapi import APIRouter, Depends, HTTPException
from app.models.request_models import GrammarCheckRequest
from app.ml.grammar_model import check_grammar
from app.core.security import get_current_user

router = APIRouter()

@router.post("/check")
async def check(request: GrammarCheckRequest, user: dict = Depends(get_current_user)):
    try:
        result = check_grammar(request.text)
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
