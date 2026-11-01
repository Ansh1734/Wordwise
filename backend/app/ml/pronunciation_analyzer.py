from app.ml.speech_recognition import transcribe_audio
import math
import re
from difflib import SequenceMatcher

def analyze_pronunciation(target_word: str, audio_path: str):
    """
    Analyzes pronunciation by comparing the Whisper transcript to the target word.
    Uses Whisper's word-level probabilities to gauge confidence.
    """
    transcription_result = transcribe_audio(audio_path, expected_word=target_word)
    transcript = transcription_result["transcript"].lower()
    target = target_word.lower()

    transcript_words = re.findall(r"[\w']+", transcript)
    normalized_target = re.sub(r"[^\w']", "", target)
    similarity = max(
        (SequenceMatcher(None, word, normalized_target).ratio() for word in transcript_words),
        default=0.0
    )

    if transcription_result.get("no_speech_probability", 0.0) >= 0.8:
        transcript_words = []
        similarity = 0.0
        transcript = ""

    avg_logprob = transcription_result.get("avg_logprob")
    confidence = math.exp(min(0.0, avg_logprob)) if avg_logprob is not None else 0.5
    score = round((similarity * 0.9 + confidence * 0.1) * 100) if transcript_words else 0

    if not transcript_words:
        feedback = "No speech was detected. Check your selected microphone and try again."
    elif score >= 90:
        feedback = f"Great job! You pronounced '{target_word}' very clearly."
    elif score >= 70:
        feedback = f"Good attempt. We heard something close to '{transcript}'. Try to emphasize the sounds of '{target_word}'."
    else:
        feedback = f"We heard '{transcript}'. Focus on the phonemes in '{target_word}' and try again."

    problem_areas = []
    if similarity < 0.8:
        problem_areas.append(target_word)

    return {
        "score": score,
        "feedback": feedback,
        "problemAreas": problem_areas,
        "transcript": transcript
    }
