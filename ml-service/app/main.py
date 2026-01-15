from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import MLScoreRequest, MLScoreResponse
from app.services.scorer import MLScorer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fraud Detection ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scorer
scorer = MLScorer()

@app.on_event("startup")
async def startup():
    """Load model on startup"""
    try:
        scorer.load_model()
        logger.info("ML model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
        logger.warning("Service will use fallback scoring")

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": scorer.model_loaded,
        "model_version": scorer.model_version if scorer.model_loaded else None
    }

@app.post("/score", response_model=MLScoreResponse)
async def score_transaction(request: MLScoreRequest):
    """
    Score a transaction for fraud risk using ML anomaly detection
    
    Returns:
        MLScoreResponse with ml_score (0-1), model_version, and contributing reasons
    """
    try:
        result = scorer.score(request)
        return result
    except Exception as e:
        logger.error(f"Error scoring transaction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")
