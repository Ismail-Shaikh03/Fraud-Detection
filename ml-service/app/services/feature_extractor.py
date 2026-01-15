import numpy as np
from typing import Dict, Any

class FeatureExtractor:
    """Feature extraction utilities for training and inference"""
    
    @staticmethod
    def extract_features(transaction_data: Dict[str, Any]) -> np.ndarray:
        """Extract features from transaction dictionary"""
        amount = transaction_data.get('amount', 0.0)
        hour_of_day = transaction_data.get('hour_of_day', 0)
        velocity_10m = transaction_data.get('velocity_10m', 0)
        distance_km = transaction_data.get('distance_from_last_km', 0.0)
        is_new_device = transaction_data.get('is_new_device', 0)
        is_new_merchant = transaction_data.get('is_new_merchant', 0)
        merchant_category = transaction_data.get('merchant_category', '')
        
        # Same feature engineering as in scorer
        log_amount = np.log1p(amount)
        hour_sin = np.sin(2 * np.pi * hour_of_day / 24)
        hour_cos = np.cos(2 * np.pi * hour_of_day / 24)
        velocity_norm = min(velocity_10m / 10.0, 1.0)
        distance_norm = min(distance_km / 1000.0, 1.0)
        
        risky_categories = {"electronics", "crypto", "gift_cards", "jewelry", 
                           "luxury_goods", "prepaid_cards"}
        is_risky_category = 1.0 if merchant_category.lower() in risky_categories else 0.0
        
        return np.array([
            log_amount, hour_sin, hour_cos, velocity_norm,
            distance_norm, float(is_new_device), float(is_new_merchant),
            is_risky_category
        ])
