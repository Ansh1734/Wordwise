from app.ml.model_manager import model_manager

def analyze_linguistics(text: str):
    nlp = model_manager.get_spacy()
    doc = nlp(text)
    
    tokens = []
    for token in doc:
        tokens.append({
            "text": token.text,
            "lemma": token.lemma_,
            "pos": token.pos_,
            "tag": token.tag_,
            "dep": token.dep_,
            "is_alpha": token.is_alpha,
            "is_stop": token.is_stop
        })
        
    sentences = [sent.text for sent in doc.sents]
    
    return {
        "text": text,
        "sentences": sentences,
        "tokens": tokens
    }

def decompose_word(word: str):
    """
    Approximation of word decomposition using spaCy's morphology and basic English prefix/suffix rules.
    """
    nlp = model_manager.get_spacy()
    doc = nlp(word)
    if len(doc) == 0:
        return {"word": word}
        
    token = doc[0]
    
    # Common English prefixes and suffixes for approximation
    prefixes = ["un", "re", "in", "im", "dis", "en", "non", "anti", "pre", "mis"]
    suffixes = ["ness", "tion", "sion", "ment", "ity", "ty", "er", "or", "ist", "ism", "able", "ible", "al", "ial", "y", "ly", "ful", "less", "ing", "ed", "es", "s"]
    
    prefix = ""
    suffix = ""
    root = word.lower()
    
    for p in prefixes:
        if root.startswith(p):
            prefix = p
            root = root[len(p):]
            break
            
    for s in suffixes:
        if root.endswith(s) and len(root) > len(s):
            suffix = s
            root = root[:-len(s)]
            break
            
    return {
        "word": word,
        "prefix": prefix if prefix else None,
        "root": root if root else word,
        "suffix": suffix if suffix else None,
        "lemma": token.lemma_,
        "partOfSpeech": token.pos_,
        "morphology": token.morph.to_dict()
    }
