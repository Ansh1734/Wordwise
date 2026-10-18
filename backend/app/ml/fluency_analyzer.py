import re

def calculate_fluency(transcript: str, duration_seconds: float, words: list = None):
    """
    Deterministic fluency calculator.
    Uses timestamps if available to calculate accurate pauses.
    Otherwise, relies on simple word counts.
    """
    # Clean text to get word count
    clean_transcript = re.sub(r'[^\w\s]', '', transcript).lower()
    word_list = [w for w in clean_transcript.split() if w]
    num_words = len(word_list)
    
    # Words per minute
    duration_minutes = duration_seconds / 60.0 if duration_seconds > 0 else 1.0
    wpm = num_words / duration_minutes
    
    # Filler words
    filler_set = {"um", "uh", "like", "basically", "actually", "you know"}
    filler_count = sum(1 for w in word_list if w in filler_set)
    
    # Calculate pauses using Whisper word timestamps if available
    pause_count = 0
    average_pause = 0.0
    long_pauses = 0
    
    if words and len(words) > 1:
        total_pause_time = 0.0
        for i in range(1, len(words)):
            pause = words[i]["start"] - words[i-1]["end"]
            if pause > 0.5: # More than 500ms is a noticeable pause
                pause_count += 1
                total_pause_time += pause
                if pause > 1.5: # Long pause
                    long_pauses += 1
        
        if pause_count > 0:
            average_pause = total_pause_time / pause_count
            
    # Calculate a score 0-100
    # Optimal WPM for English learners is around 110-150.
    wpm_score = 100
    if wpm < 100:
        wpm_score = max(0, 100 - (100 - wpm))
    elif wpm > 160:
        wpm_score = max(0, 100 - (wpm - 160))
        
    filler_penalty = min(30, filler_count * 5)
    pause_penalty = min(30, (pause_count * 2) + (long_pauses * 5))
    
    fluency_score = max(0, min(100, wpm_score - filler_penalty - pause_penalty))
    
    return {
        "wordsPerMinute": round(wpm),
        "fillerWords": filler_count,
        "pauseCount": pause_count,
        "averagePause": round(average_pause, 2),
        "longPauses": long_pauses,
        "fluencyScore": round(fluency_score)
    }
