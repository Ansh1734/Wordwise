from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
import shutil
import os
from app.ml.speech_recognition import transcribe_audio
from app.core.security import get_current_user

router = APIRouter()

@router.post("/analyze")
async def analyze_reading(
    targetText: str = Form(...),
    durationSeconds: int = Form(...),
    audio: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if not audio.filename.endswith((".wav", ".mp3", ".webm", ".ogg")):
        raise HTTPException(status_code=400, detail="Invalid audio format")
        
    temp_path = f"temp_reading_{user['sub']}_{audio.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        transcription = transcribe_audio(temp_path)
        transcript = transcription["transcript"]
        
        # Determine stats (basic approximation)
        words_read = len(targetText.split())
        words_recognized = len(transcript.split())
        
        # Approximation of clarity, pacing, and pronunciation
        pacing = 100
        wpm = (words_recognized / (durationSeconds / 60)) if durationSeconds > 0 else 0
        if wpm < 100:
            pacing = max(0, 100 - int(100 - wpm))
        elif wpm > 160:
            pacing = max(0, 100 - int(wpm - 160))
            
        # Simplified for demonstration
        pronunciation_score = min(100, int((words_recognized / max(1, words_read)) * 100))
        
        overall = int(pronunciation_score * 0.5 + pacing * 0.5)
        
        return {
            "stats": {
                "wordsRead": words_read,
                "wordsRecognized": words_recognized,
                "skippedWords": max(0, words_read - words_recognized),
                "repeatedWords": 0
            },
            "scores": {
                "pacing": pacing,
                "clarity": pronunciation_score,
                "pronunciation": pronunciation_score,
                "pauses": 100,
                "overall": overall
            },
            "feedback": {
                "strengths": ["Good attempt at reading", "Clear audio recorded"],
                "weaknesses": ["Keep practicing difficult words"]
            },
            "problemWords": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
