# CardioTwin Backend

This is the machine learning backend for the CardioTwin project, providing explainable coronary artery disease prediction.

## Architecture
- **API Framework:** FastAPI
- **Machine Learning:** XGBoost with `CalibratedClassifierCV` (10-fold Stratified CV)
- **Explainability:** SHAP (TreeExplainer)
- **Deployment:** Docker

## Setup & Running Locally

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Running with Docker

You can easily spin up the backend using Docker:
```bash
docker compose up --build
```
The API will be available at `http://localhost:8000`.

## API Endpoints

- `GET /health` - Check if the API is alive and models are loaded.
- `GET /api/schema` - Get the required feature schema.
- `GET /api/metrics` - Retrieve the pre-computed metrics and plots.
- `GET /api/patients` - Load dummy sample patients for UI testing.
- `POST /api/predict` - Accepts patient features and returns CAD/LAD/LCX/RCA probabilities and clinical narratives.

## Preprocessing & Leakage Prevention
The system guarantees that target columns (`Cath`, `LAD`, `LCX`, `RCA`) are rigorously dropped via `build_X()` before any model training or inference, preventing data leakage.

## Medical Safety Disclaimer
*CardioTwin is a hackathon/research prototype providing AI-assisted risk estimation. It is not a substitute for professional medical diagnosis or clinical judgment.*
