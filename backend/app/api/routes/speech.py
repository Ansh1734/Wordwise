from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
import shutil
import os
from app.ml.speech_recognition import transcribe_audio
from app.ml.fluency_analyzer import calculate_fluency
from app.core.security import get_current_user

router = APIRouter()

@router.post("/analyze")
async def analyze_speech(
    audio: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """
    Transcribes audio and calculates fluency metrics.
    """
    if not audio.filename.endswith((".wav", ".mp3", ".webm", ".ogg")):
        raise HTTPException(status_code=400, detail="Invalid audio format")
        
    temp_path = f"temp_{user['sub']}_{audio.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        transcription = transcribe_audio(temp_path)
        
        # Calculate fluency
        fluency_metrics = calculate_fluency(
            transcript=transcription["transcript"],
            duration_seconds=transcription.get("duration", 0),
            words=transcription.get("words", [])
        )
        
        return {
            "success": True,
            "transcript": transcription["transcript"],
            "metrics": fluency_metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
