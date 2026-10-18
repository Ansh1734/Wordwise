from pydantic import BaseModel
from typing import List, Optional

class GrammarCheckRequest(BaseModel):
    text: str

class SemanticSimilarityRequest(BaseModel):
    sentence1: str
    sentence2: str

class DecomposeRequest(BaseModel):
    word: str
