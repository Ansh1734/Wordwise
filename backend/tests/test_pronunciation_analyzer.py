from app.ml import pronunciation_analyzer
from app.ml import speech_recognition
from app.api.routes.pronunciation import get_pronunciation_user
from app.core.config import settings
from fastapi import HTTPException
from types import SimpleNamespace
import pytest
import numpy as np


def test_analyze_pronunciation_scores_the_target_word(monkeypatch):
    monkeypatch.setattr(
        pronunciation_analyzer,
        "transcribe_audio",
        lambda _, expected_word: {
            "expected_word": expected_word,
            "transcript": "Hello!",
            "avg_logprob": -0.2,
        },
    )

    result = pronunciation_analyzer.analyze_pronunciation("hello", "recording.webm")

    assert result["score"] == 98
    assert result["transcript"] == "hello!"
    assert result["problemAreas"] == []


def test_analyze_pronunciation_handles_empty_audio_transcript(monkeypatch):
    monkeypatch.setattr(
        pronunciation_analyzer,
        "transcribe_audio",
        lambda _, expected_word: {"transcript": "", "avg_logprob": None},
    )

    result = pronunciation_analyzer.analyze_pronunciation("hello", "recording.webm")

    assert result["score"] == 0
    assert result["problemAreas"] == ["hello"]
    assert "No speech was detected" in result["feedback"]


def test_analyze_pronunciation_lowers_score_for_misheard_word(monkeypatch):
    monkeypatch.setattr(
        pronunciation_analyzer,
        "transcribe_audio",
        lambda _, expected_word: {"transcript": "yellow", "avg_logprob": -0.1},
    )

    result = pronunciation_analyzer.analyze_pronunciation("hello", "recording.webm")

    assert result["score"] < 90
    assert result["problemAreas"] == ["hello"]


def test_transcription_uses_fast_settings_without_word_timestamps(monkeypatch):
    class Segment:
        text = " hello"
        avg_logprob = -0.2
        no_speech_prob = 0.01

    class Info:
        language = "en"
        language_probability = 0.99
        duration = 1.0

    class Model:
        def transcribe(self, audio_path, **options):
            assert audio_path.shape == (16000,)
            assert audio_path.max() == pytest.approx(0.1)
            assert options == {
                "language": "en",
                "beam_size": 1,
                "best_of": 1,
                "initial_prompt": "The speaker is saying the single English word: hello.",
                "word_timestamps": False,
                "condition_on_previous_text": False,
                "vad_filter": False,
            }
            return iter([Segment()]), Info()

    monkeypatch.setattr(
        speech_recognition,
        "decode_audio",
        lambda audio_path, sampling_rate: np.full(16000, 0.01, dtype="float32"),
    )
    monkeypatch.setattr(speech_recognition.model_manager, "get_whisper", lambda: Model())

    result = speech_recognition.transcribe_audio("recording.webm", expected_word="hello")

    assert result["transcript"] == "hello"
    assert result["avg_logprob"] == -0.2
    assert result["no_speech_probability"] == 0.01


def test_target_hint_recognized_word_scores_and_silence_rejected(monkeypatch):
    def transcribe_with_low_confidence_hint(audio_path, expected_word):
        assert expected_word == "prepare"
        return {
            "transcript": "prepare",
            "avg_logprob": -0.1,
            "no_speech_probability": 0.95,
        }

    monkeypatch.setattr(
        pronunciation_analyzer, "transcribe_audio", transcribe_with_low_confidence_hint
    )

    result = pronunciation_analyzer.analyze_pronunciation("prepare", "recording.webm")

    assert result["score"] == 0
    assert result["problemAreas"] == ["prepare"]
    assert "No speech was detected" in result["feedback"]


def test_local_development_pronunciation_does_not_require_supabase_login(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "development")
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))

    assert get_pronunciation_user(request, credentials=None) == {
        "sub": "local-development"
    }


def test_pronunciation_requires_authentication_outside_local_development(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))

    with pytest.raises(HTTPException) as error:
        get_pronunciation_user(request, credentials=None)

    assert error.value.status_code == 401
