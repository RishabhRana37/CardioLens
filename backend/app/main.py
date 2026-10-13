import time
import uuid
import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.endpoints import router as api_router, health_check

logger = logging.getLogger("cardiolens")

tags_metadata = [
    {
        "name": "Clinical Risk Inference",
        "description": "Multi-vessel coronary artery disease probability estimation with epistemic uncertainty and confidence bounds."
    },
    {
        "name": "Physiological Explainability",
        "description": "TreeExplainer SHAP contributions, local feature attribution, and natural-language clinical narratives."
    },
    {
        "name": "Model Trust & Benchmarks",
        "description": "Cross-validation performance metrics (ROC-AUC, F1, recall), curve assets, and Dual-Cohort 50k generalization benchmarks."
    },
    {
        "name": "Clinical Schema & Patients",
        "description": "Authoritative 55-biomarker schema definitions and curated prospective clinical demo patient profiles."
    },
    {
        "name": "Regulatory & System Health",
        "description": "Software as a Medical Device (SaMD) non-diagnostic CDS declarations, anti-leakage audit, and microservice health checks."
    }
]

app = FastAPI(
    title="CardioLens AI Engine",
    description="""
### Explainable Coronary Artery Digital Twin & Multi-Vessel Risk Estimation API

CardioLens is an AI-assisted clinical decision support system designed to estimate coronary artery disease risk across four physiological targets:
* **CAD** (Overall Coronary Artery Disease)
* **LAD** (Left Anterior Descending Artery)
* **LCX** (Left Circumflex Artery)
* **RCA** (Right Coronary Artery)

#### Core Engineering Guarantees:
1. **Mathematical Anti-Leakage:** Zero target-leakage in feature pipeline.
2. **Probability Calibration:** Isotonic/sigmoid calibration over Stratified 10-Fold Cross-Validation.
3. **Epistemic Uncertainty:** 95% Confidence Intervals calculated across ensemble cross-validation folds.
4. **Out-of-Distribution Screening:** Automated physiological sanity checks on input biomarkers.
5. **Dual-Cohort Validation:** Validated against a 50,000-patient synthetic simulation cohort.
    """,
    version="1.0.0",
    openapi_tags=tags_metadata
)

# Enterprise Observability Middleware: X-Process-Time and X-Request-ID
@app.middleware("http")
async def add_observability_headers(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", f"req-{uuid.uuid4().hex[:8]}")
    t0 = time.perf_counter()
    
    response = await call_next(request)
    
    elapsed_ms = (time.perf_counter() - t0) * 1000
    response.headers["X-Process-Time"] = f"{elapsed_ms:.2f}ms"
    response.headers["X-Request-ID"] = req_id
    return response

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-Request-ID"]
)

# Mount canonical /api/v1 and legacy /api routers
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

# Mount static plots directory
models_dir = Path(__file__).parent.parent / "models"
plots_dir = models_dir / "plots"
if plots_dir.exists():
    app.mount("/static/plots", StaticFiles(directory=str(plots_dir)), name="plots")

# Global Safe Exception Handler (prevents stack-trace leaks)
@app.exception_handler(Exception)
async def safe_exception_handler(request: Request, exc: Exception):
    # Allow standard HTTP exceptions (404, 422, etc.) to pass through normally
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "error", "message": exc.detail, "path": request.url.path}
        )
        
    logger.error(f"Unhandled server error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_type": type(exc).__name__,
            "message": "An internal inference error occurred. Please verify biomarker inputs.",
            "path": request.url.path
        }
    )

@app.get("/", tags=["Regulatory & System Health"])
def root():
    return {
        "status": "ok",
        "service": "CardioLens AI Engine",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/v1/health",
            "schema": "/api/v1/schema",
            "patients": "/api/v1/patients",
            "predict": "/api/v1/predict",
            "explain": "/api/v1/explain",
            "metrics": "/api/v1/metrics",
            "cohorts": "/api/v1/cohorts",
            "compliance": "/api/v1/compliance",
            "docs": "/docs"
        }
    }

@app.get("/health", tags=["Regulatory & System Health"])
def root_health():
    return health_check()
