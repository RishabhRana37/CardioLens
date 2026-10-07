from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="CardioTwin API",
    description="Backend for Explainable Cardiac Digital Twin",
    version="1.0.0"
)

# Allow React frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev. Restrict in prod!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok", "service": "CardioTwin API", "docs": "/docs"}

@app.get("/health")
def health_check():
    from app.api.endpoints import models
    return {
        "status": "ok", 
        "service": "CardioTwin API",
        "models_loaded": len(models) == 4
    }
