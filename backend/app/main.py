from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api.endpoints import router as api_router, health_check

app = FastAPI(
    title="CardioTwin API",
    description="Backend for Explainable Cardiac Digital Twin",
    version="1.0.0"
)

# Allow React frontend to access the API with zero friction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount both /api/v1 (PRD canonical) and /api (legacy alias)
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

# Mount static plots directory so ROC curves and calibration charts are viewable
models_dir = Path(__file__).parent.parent / "models"
plots_dir = models_dir / "plots"
if plots_dir.exists():
    app.mount("/static/plots", StaticFiles(directory=str(plots_dir)), name="plots")

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "CardioTwin API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/v1/health",
            "schema": "/api/v1/schema",
            "patients": "/api/v1/patients",
            "predict": "/api/v1/predict",
            "explain": "/api/v1/explain",
            "metrics": "/api/v1/metrics",
            "docs": "/docs"
        }
    }

@app.get("/health")
def root_health():
    return health_check()
