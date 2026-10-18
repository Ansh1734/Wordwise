from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="WordWise NLP Backend",
    description="Backend for WordWise powered by local NLP models",
    version="1.0.0"
)

# Set up CORS
origins = settings.ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "api": "WordWise NLP Backend",
        "version": "1.0.0"
    }

from app.api.routes import speech, pronunciation, grammar, nlp, reading, interview

app.include_router(speech.router, prefix="/api/v1/speech", tags=["speech"])
app.include_router(pronunciation.router, prefix="/api/v1/pronunciation", tags=["pronunciation"])
app.include_router(grammar.router, prefix="/api/v1/grammar", tags=["grammar"])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["nlp"])
app.include_router(reading.router, prefix="/api/v1/reading", tags=["reading"])
app.include_router(interview.router, prefix="/api/v1/interview", tags=["interview"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
