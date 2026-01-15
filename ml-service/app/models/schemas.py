from pydantic import BaseModel, Field
from typing import Optional, List

class MLScoreRequest(BaseModel):
    """Request schema for ML scoring"""
    amount: float = Field(..., description="Transaction amount", gt=0)
    hourOfDay: int = Field(..., description="Hour of day (0-23)", ge=0, le=23)
    velocity10m: int = Field(..., description="Number of transactions in last 10 minutes", ge=0)
    distanceFromLastKm: float = Field(..., description="Distance from last transaction in km", ge=0)
    isNewDevice: int = Field(..., description="1 if new device, 0 otherwise", ge=0, le=1)
    isNewMerchant: int = Field(..., description="1 if new merchant, 0 otherwise", ge=0, le=1)
    merchantCategory: str = Field(..., description="Merchant category")

class MLScoreResponse(BaseModel):
    """Response schema for ML scoring"""
    mlScore: float = Field(..., description="ML anomaly score (0-1, where 1 is most anomalous)", ge=0, le=1)
    modelVersion: str = Field(..., description="Version of the model used")
    contributingReasons: Optional[List[str]] = Field(None, description="List of contributing factors")
