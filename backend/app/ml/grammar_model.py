from app.ml.model_manager import model_manager
from app.ml.linguistic_analyzer import analyze_linguistics
import re

def check_grammar(text: str):
    """
    Checks grammar using a local sequence-to-sequence model (like T5) 
    and supplements it with spaCy for deterministic checking if needed.
    """
    pipeline = model_manager.get_grammar_model()
    
    # The grammar corrector model usually expects something like "gec: text"
    # Depending on the exact model, the prefix might differ.
    # We will just pass the text for standard text2text-generation.
    
    results = pipeline(f"gec: {text}", max_length=128)
    corrected_text = results[0]['generated_text']
    
    # We can detect errors by comparing the original text and corrected text.
    # For a real implementation, we would align the words to find exact replacements.
    # Here we do a simple diff.
    
    errors = []
    
    # Basic token-level comparison using spaCy
    nlp = model_manager.get_spacy()
    orig_doc = nlp(text)
    corr_doc = nlp(corrected_text)
    
    orig_words = [token.text for token in orig_doc]
    corr_words = [token.text for token in corr_doc]
    
    score = 100
    
    if text.strip() != corrected_text.strip():
        # A simple approximation: if lengths differ or words differ, there is an error.
        errors.append({
            "type": "grammar_error",
            "original": text,
            "correction": corrected_text,
            "explanation": "The sentence structure or grammar was corrected by the model."
        })
        # Subtract score based on difference ratio
        import difflib
        ratio = difflib.SequenceMatcher(None, text, corrected_text).ratio()
        score = int(ratio * 100)
    
    return {
        "original": text,
        "corrected": corrected_text,
        "errors": errors,
        "score": score
    }
