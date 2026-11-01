from app.ml.model_manager import model_manager
import numpy as np
from faster_whisper.audio import decode_audio

def transcribe_audio(audio_path: str, expected_word: str | None = None):
    """
    Transcribes short pronunciation recordings with low-latency settings.
    """
    model = model_manager.get_whisper()
    audio = decode_audio(audio_path, sampling_rate=16000)
    if audio.size:
        rms = float(np.sqrt(np.mean(np.square(audio), dtype=np.float64)))
        if rms >= 0.00001:
            gain = min(0.1 / rms, 10.0)
            audio = np.clip(audio * gain, -1.0, 1.0)

    prompt = (
        f"The speaker is saying the single English word: {expected_word}."
        if expected_word else None
    )
    segments, info = model.transcribe(
        audio,
        language="en",
        beam_size=1,
        best_of=1,
        initial_prompt=prompt,
        word_timestamps=False,
        condition_on_previous_text=False,
        vad_filter=False,
    )

    transcript = ""
    log_probabilities = []
    no_speech_probabilities = []

    for segment in segments:
        transcript += segment.text + " "
        log_probabilities.append(segment.avg_logprob)
        no_speech_probabilities.append(segment.no_speech_prob)

    return {
        "transcript": transcript.strip(),
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "avg_logprob": (
            sum(log_probabilities) / len(log_probabilities)
            if log_probabilities else None
        ),
        "no_speech_probability": (
            max(no_speech_probabilities) if no_speech_probabilities else 1.0
        ),
    }
