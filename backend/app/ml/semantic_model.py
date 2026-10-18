from app.ml.model_manager import model_manager
import numpy as np

def calculate_similarity(text1: str, text2: str) -> float:
    """
    Calculates cosine similarity between two texts using Sentence Transformers.
    """
    model = model_manager.get_sentence_transformer()
    embeddings = model.encode([text1, text2])
    
    vec1 = embeddings[0]
    vec2 = embeddings[1]
    
    similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    # Clip to [0, 1] range to avoid floating point issues
    return max(0.0, min(1.0, float(similarity)))
