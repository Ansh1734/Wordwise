from fastapi import APIRouter, File, UploadFile, Depends, Form, HTTPException
import shutil
import os
from app.ml.pronunciation_analyzer import analyze_pronunciation
from app.core.security import get_current_user

router = APIRouter()

@router.post("/analyze")
async def check_pronunciation(
    word: str = Form(...),
    audio: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if not audio.filename.endswith((".wav", ".mp3", ".webm", ".ogg")):
        raise HTTPException(status_code=400, detail="Invalid audio format")
        
    temp_path = f"temp_pronunc_{user['sub']}_{audio.filename}"
    try:
        with open(temp_path, "wb") as buffer:
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
        if os.path.exists(temp_path):
            os.remove(temp_path)
