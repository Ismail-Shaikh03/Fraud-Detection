import os
import sys
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.feature_extractor import FeatureExtractor

def generate_training_data(n_samples: int = 10000) -> np.ndarray:
    """Generate synthetic training data"""
    print(f"Generating {n_samples} training samples...")
    
    features_list = []
    for i in range(n_samples):
        # Simulate normal transaction patterns
        amount = np.random.lognormal(mean=4.0, sigma=1.5)  # Typical amounts
        # Fixed: Normalize probabilities to sum to 1.0
        hour_probs = np.array([0.02]*6 + [0.05]*8 + [0.08]*4 + [0.05]*6)
        hour_probs = hour_probs / hour_probs.sum()  # Normalize
        hour = np.random.choice(24, p=hour_probs)  # More during day
        velocity = np.random.poisson(0.5)  # Low velocity typically
        distance = np.random.exponential(50)  # Small distances typically
        is_new_device = np.random.choice([0, 1], p=[0.9, 0.1])
        is_new_merchant = np.random.choice([0, 1], p=[0.85, 0.15])
        merchant_category = np.random.choice([
            "groceries", "restaurant", "gas", "retail", "electronics", "crypto"
        ], p=[0.3, 0.25, 0.2, 0.15, 0.05, 0.05])
        
        transaction_data = {
            'amount': amount,
            'hour_of_day': hour,
            'velocity_10m': velocity,
            'distance_from_last_km': distance,
            'is_new_device': is_new_device,
            'is_new_merchant': is_new_merchant,
            'merchant_category': merchant_category
        }
        
        features = FeatureExtractor.extract_features(transaction_data)
        features_list.append(features)
    
    return np.array(features_list)

def train_model():
    """Train Isolation Forest model"""
    print("Training Isolation Forest model...")
    
    # Generate training data
    X_train = generate_training_data(n_samples=10000)
    
    # Train Isolation Forest
    # contamination: expected proportion of anomalies (10%)
    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train)
    
    # Save model
    model_dir = os.path.join(os.path.dirname(__file__), "../models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "isolation_forest_v1.joblib")
    
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    # Test model
    test_samples = generate_training_data(n_samples=100)
    predictions = model.predict(test_samples)
    anomaly_rate = (predictions == -1).sum() / len(predictions)
    print(f"Test anomaly rate: {anomaly_rate:.2%}")

if __name__ == "__main__":
    train_model()
