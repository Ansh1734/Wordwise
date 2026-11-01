from fastapi import APIRouter, File, UploadFile, Depends, Form, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import shutil
import os
import tempfile
import ipaddress
from app.ml.pronunciation_analyzer import analyze_pronunciation
from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter()
optional_bearer = HTTPBearer(auto_error=False)


def get_pronunciation_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
):
    if credentials:
        return get_current_user(credentials)

    client_host = request.client.host if request.client else ""
    try:
        is_loopback = ipaddress.ip_address(client_host).is_loopback
    except ValueError:
        is_loopback = False

    if settings.APP_ENV == "development" and is_loopback:
        return {"sub": "local-development"}

    raise HTTPException(status_code=401, detail="Authentication is required for pronunciation analysis.")

@router.post("/analyze")
async def check_pronunciation(
    word: str = Form(...),
    audio: UploadFile = File(...),
    user: dict = Depends(get_pronunciation_user)
):
    suffix = os.path.splitext(audio.filename or "")[1].lower()
    if suffix not in (".wav", ".mp3", ".webm", ".ogg", ".mp4"):
        raise HTTPException(status_code=400, detail="Invalid audio format")
        
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as buffer:
            temp_path = buffer.name
            shutil.copyfileobj(audio.file, buffer)
            
        result = analyze_pronunciation(word, temp_path)
        
        return {
            "success": True,
            "score": result["score"],
            "feedback": result["feedback"],
            "problemAreas": result["problemAreas"],
            "transcript": result["transcript"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
