from app.ml.speech_recognition import transcribe_audio
import Levenshtein

def analyze_pronunciation(target_word: str, audio_path: str):
    """
    Analyzes pronunciation by comparing the Whisper transcript to the target word.
    Uses Whisper's word-level probabilities to gauge confidence.
    """
    transcription_result = transcribe_audio(audio_path)
    transcript = transcription_result["transcript"].lower()
    target = target_word.lower()
    
    # Calculate similarity between expected word and what was transcribed
    similarity = Levenshtein.ratio(transcript, target)
    
    # Also look at whisper word confidence if the word is in the transcript
    confidence = 0.5 # default
    if transcription_result.get("words"):
        for w in transcription_result["words"]:
            if w["word"].lower().strip(".,!?") == target:
                confidence = w["probability"]
                break
                
    # A mix of whether the recognizer heard the word correctly (similarity)
    # and how confident it was (confidence).
    score = int(((similarity * 0.7) + (confidence * 0.3)) * 100)
    
    feedback = ""
    if score >= 90:
        feedback = f"Great job! You pronounced '{target_word}' very clearly."
    elif score >= 70:
        feedback = f"Good attempt. We heard something close to '{transcript}'. Try to emphasize the sounds of '{target_word}'."
    else:
        feedback = f"We heard '{transcript}'. Focus on the phonemes in '{target_word}' and try again."
        
    problem_areas = []
    if similarity < 0.8:
        problem_areas.append(target_word) # Basic fallback for problem areas
        
    return {
        "score": score,
        "feedback": feedback,
        "problemAreas": problem_areas,
        "transcript": transcript
    }
