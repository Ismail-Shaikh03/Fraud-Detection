import os
import joblib
import numpy as np
from typing import Optional
from app.models.schemas import MLScoreRequest, MLScoreResponse
import logging

logger = logging.getLogger(__name__)

class MLScorer:
    """ML anomaly detection scorer using Isolation Forest"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv(
            "MODEL_PATH", 
            os.path.join(os.path.dirname(__file__), "../../models/isolation_forest_v1.joblib")
        )
        self.model = None
        self.model_loaded = False
        self.model_version = "fallback_v1"
        
        # Risky categories for explainability
        self.risky_categories = {
            "electronics", "crypto", "gift_cards", "jewelry",
            "luxury_goods", "prepaid_cards"
        }
    
    def load_model(self):
        """Load the trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.model_loaded = True
                self.model_version = "isolation_forest_v1"
                logger.info(f"Model loaded from {self.model_path}")
            else:
                logger.warning(f"Model file not found at {self.model_path}, using fallback")
                self.model_loaded = False
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model_loaded = False
    
    def extract_features(self, request: MLScoreRequest) -> np.ndarray:
        """Extract features from request for model prediction"""
        # Normalize amount (log transform for better distribution)
        log_amount = np.log1p(request.amount)
        
        # Time features (cyclic encoding)
        hour_sin = np.sin(2 * np.pi * request.hourOfDay / 24)
        hour_cos = np.cos(2 * np.pi * request.hourOfDay / 24)
        
        # Velocity feature (normalized)
        velocity_norm = min(request.velocity10m / 10.0, 1.0)
        
        # Distance feature (normalized)
        distance_norm = min(request.distanceFromLastKm / 1000.0, 1.0)
        
        # Binary features
        is_new_device = float(request.isNewDevice)
        is_new_merchant = float(request.isNewMerchant)
        
        # Merchant category encoding (binary for risky category)
        is_risky_category = 1.0 if request.merchantCategory.lower() in self.risky_categories else 0.0
        
        # Combine features
        features = np.array([
            log_amount,
            hour_sin,
            hour_cos,
            velocity_norm,
            distance_norm,
            is_new_device,
            is_new_merchant,
            is_risky_category
        ]).reshape(1, -1)
        
        return features
    
    def score(self, request: MLScoreRequest) -> MLScoreResponse:
        """
        Score a transaction for anomaly
        
        Returns:
            MLScoreResponse with anomaly score and contributing reasons
        """
        features = self.extract_features(request)
        contributing_reasons = []
        
        if self.model_loaded and self.model is not None:
            try:
                # Predict anomaly
                prediction = self.model.predict(features)[0]  # -1 = anomaly, 1 = normal
                decision_score = self.model.decision_function(features)[0]
                
                # Normalize to 0-1 (1 = most anomalous)
                # IsolationForest: negative decision_score = anomaly
                # Normalize: (1 - (decision_score + 1) / 2) gives 0-1 range
                ml_score = (1 - (decision_score + 1) / 2)
                ml_score = max(0.0, min(1.0, ml_score))
                
                # Generate contributing reasons
                if ml_score > 0.5:
                    if request.velocity10m > 3:
                        contributing_reasons.append(f"High transaction velocity: {request.velocity10m} in 10 minutes")
                    if request.distanceFromLastKm > 100:
                        contributing_reasons.append(f"Large geographic distance: {request.distanceFromLastKm} km")
                    if request.isNewDevice == 1:
                        contributing_reasons.append("Transaction from new device")
                    if request.isNewMerchant == 1:
                        contributing_reasons.append("Transaction with new merchant")
                    if request.merchantCategory.lower() in self.risky_categories:
                        contributing_reasons.append(f"Risky merchant category: {request.merchantCategory}")
                    if request.amount > 1000:
                        contributing_reasons.append(f"High transaction amount: ${request.amount:.2f}")
                
            except Exception as e:
                logger.error(f"Error in model prediction: {e}")
                ml_score = self._fallback_score(request)
        else:
            ml_score = self._fallback_score(request)
        
        return MLScoreResponse(
            mlScore=ml_score,
            modelVersion=self.model_version,
            contributingReasons=contributing_reasons if contributing_reasons else None
        )
    
    def _fallback_score(self, request: MLScoreRequest) -> float:
        """Fallback heuristic scoring when model is not available"""
        score = 0.0
        
        # Amount-based risk
        if request.amount > 1000:
            score += 0.2
        if request.amount > 5000:
            score += 0.2
        
        # Velocity risk
        if request.velocity10m > 3:
            score += 0.2
        if request.velocity10m > 5:
            score += 0.1
        
        # Geographic risk
        if request.distanceFromLastKm > 100:
            score += 0.15
        
        # Device risk
        if request.isNewDevice == 1:
            score += 0.1
        
        # Merchant risk
        if request.isNewMerchant == 1:
            score += 0.1
        if request.merchantCategory.lower() in self.risky_categories:
            score += 0.1
        
        return min(1.0, score)
