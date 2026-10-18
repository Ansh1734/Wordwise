from app.ml.model_manager import model_manager
import os

def transcribe_audio(audio_path: str):
    """
    Transcribes audio using faster-whisper.
    """
    model = model_manager.get_whisper()
    
    # We use segments to get word timestamps if possible, or just segment timestamps
    segments, info = model.transcribe(audio_path, beam_size=5, word_timestamps=True)
    
    transcript = ""
    words = []
    
    for segment in segments:
        transcript += segment.text + " "
        if segment.words:
            for word in segment.words:
                words.append({
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                    "probability": word.probability
                })
                
    return {
        "transcript": transcript.strip(),
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "words": words
    }
