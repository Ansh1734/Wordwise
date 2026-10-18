from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
import shutil
import os
from app.ml.speech_recognition import transcribe_audio
from app.ml.fluency_analyzer import calculate_fluency
from app.ml.grammar_model import check_grammar
from app.ml.semantic_model import calculate_similarity
from app.core.security import get_current_user

router = APIRouter()

@router.post("/analyze-answer")
async def analyze_interview_answer(
    question: str = Form(...),
    durationSeconds: int = Form(...),
    audio: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if not audio.filename.endswith((".wav", ".mp3", ".webm", ".ogg")):
        raise HTTPException(status_code=400, detail="Invalid audio format")
        
    temp_path = f"temp_interview_{user['sub']}_{audio.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        transcription = transcribe_audio(temp_path)
        transcript = transcription["transcript"]
        
        fluency = calculate_fluency(transcript, durationSeconds, transcription.get("words", []))
        grammar = check_grammar(transcript)
        
        # Semantic relevance using cosine similarity between question and answer
        # In reality, you'd compare the answer to a set of expected concepts, but as a proxy:
        relevance = calculate_similarity(question, transcript) * 100
        
        # Build feedback based on models
        score = int(
            (relevance * 0.3) +
            (grammar["score"] * 0.2) +
            (fluency["fluencyScore"] * 0.3) +
            80 * 0.2  # baseline vocabulary score for now
        )
        
        rating = "GOOD"
        if score > 85: rating = "EXCELLENT"
        elif score < 60: rating = "NEEDS WORK"
        elif score < 75: rating = "OKAY"
        
        return {
            "score": score,
            "rating": rating,
            "strengths": ["Clear speech detected", "Good pacing"] if fluency["fluencyScore"] > 80 else ["Attempted the question"],
            "weaknesses": ["Consider reducing fillers"] if fluency["fillerWords"] > 3 else ["Practice complex grammar structures"],
            "improvedVersion": grammar["corrected"],
            "grammarErrors": grammar["errors"],
            "metrics": {
                "grammar": grammar["score"],
                "vocabulary": 80,
                "relevance": int(relevance),
                "clarity": 85,
                "pronunciation": 85,
                "pacing": fluency["fluencyScore"],
                "fillers": min(100, fluency["fillerWords"] * 5)
            },
            "transcript": transcript,
            "stats": {
                "durationSeconds": durationSeconds,
                "totalWords": len(transcript.split()),
                "wpm": fluency["wordsPerMinute"],
                "fillers": {
                    "count": fluency["fillerWords"],
                    "words": []
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
