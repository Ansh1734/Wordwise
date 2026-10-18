import spacy
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ModelManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self._spacy_nlp = None
        self._whisper_model = None
        self._sentence_model = None
        self._grammar_pipeline = None
        
    def get_spacy(self):
        if self._spacy_nlp is None:
            logger.info(f"Loading spaCy model: {settings.SPACY_MODEL}")
            try:
                self._spacy_nlp = spacy.load(settings.SPACY_MODEL)
            except OSError:
                logger.warning(f"spaCy model {settings.SPACY_MODEL} not found. Attempting to download...")
                spacy.cli.download(settings.SPACY_MODEL)
                self._spacy_nlp = spacy.load(settings.SPACY_MODEL)
        return self._spacy_nlp

    def get_whisper(self):
        if self._whisper_model is None:
            from faster_whisper import WhisperModel
            logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL}")
            # Detect device ideally, defaulting to cpu for maximum compatibility if CUDA not available
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            compute_type = "float16" if device == "cuda" else "int8"
            self._whisper_model = WhisperModel(settings.WHISPER_MODEL, device=device, compute_type=compute_type, download_root=settings.MODEL_CACHE_DIR)
        return self._whisper_model

    def get_sentence_transformer(self):
        if self._sentence_model is None:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading Sentence Transformer: {settings.SENTENCE_MODEL}")
            self._sentence_model = SentenceTransformer(settings.SENTENCE_MODEL, cache_folder=settings.MODEL_CACHE_DIR)
        return self._sentence_model
        
    def get_grammar_model(self):
        if self._grammar_pipeline is None:
            from transformers import pipeline
            logger.info(f"Loading Grammar Model: {settings.GRAMMAR_MODEL}")
            import torch
            device = 0 if torch.cuda.is_available() else -1
            self._grammar_pipeline = pipeline("text2text-generation", model=settings.GRAMMAR_MODEL, device=device)
        return self._grammar_pipeline

model_manager = ModelManager()
