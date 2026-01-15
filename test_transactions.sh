#!/bin/bash

# Fraud Detection System - Test Script
# This script tests various transaction scenarios

BASE_URL="http://localhost:8080/api/transactions"
ML_URL="http://localhost:8000"

echo "=========================================="
echo "Fraud Detection System - Test Suite"
echo "=========================================="
echo ""

# Test 1: Normal Transaction (Low Risk)
echo "Test 1: Normal Transaction (Low Risk)"
echo "----------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_normal_001",
    "userId": "user_123",
    "amount": 50.0,
    "merchantId": "merchant_groceries",
    "merchantCategory": "groceries",
    "timestamp": "2024-01-15T14:00:00",
    "deviceId": "device_known_123",
    "locationState": "CA",
    "locationCountry": "US"
  }' | jq '.'
echo ""
echo ""

# Test 2: High Amount Transaction (Medium Risk)
echo "Test 2: High Amount Transaction (Medium Risk)"
echo "----------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_high_amount_001",
    "userId": "user_123",
    "amount": 5000.0,
    "merchantId": "merchant_groceries",
    "merchantCategory": "groceries",
    "timestamp": "2024-01-15T14:05:00",
    "deviceId": "device_known_123",
    "locationState": "CA",
    "locationCountry": "US"
  }' | jq '.'
echo ""
echo ""

# Test 3: Risky Category + High Amount (High Risk)
echo "Test 3: Risky Category + High Amount (High Risk)"
echo "----------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_risky_001",
    "userId": "user_123",
    "amount": 10000.0,
    "merchantId": "merchant_crypto_new",
    "merchantCategory": "crypto",
    "timestamp": "2024-01-15T14:10:00",
    "deviceId": "device_new_xyz",
    "locationState": "NY",
    "locationCountry": "US"
  }' | jq '.'
echo ""
echo ""

# Test 4: Velocity Spike (Multiple transactions quickly)
echo "Test 4: Velocity Spike Test"
echo "----------------------------------------"
for i in {1..5}; do
  echo "Transaction $i of 5..."
  curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"transactionId\": \"txn_velocity_00$i\",
      \"userId\": \"user_456\",
      \"amount\": $((100 + i * 50)).0,
      \"merchantId\": \"merchant_retail_$i\",
      \"merchantCategory\": \"retail\",
      \"timestamp\": \"2024-01-15T14:15:0$i\",
      \"deviceId\": \"device_velocity_test\",
      \"locationState\": \"CA\",
      \"locationCountry\": \"US\"
    }" | jq '.riskScore, .riskCategory, .velocityCount'
  sleep 1
done
echo ""
echo ""

# Test 5: Geographic Anomaly
echo "Test 5: Geographic Anomaly"
echo "----------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_geo_001",
    "userId": "user_123",
    "amount": 200.0,
    "merchantId": "merchant_groceries",
    "merchantCategory": "groceries",
    "timestamp": "2024-01-15T14:20:00",
    "deviceId": "device_known_123",
    "locationState": "NY",
    "locationCountry": "US"
  }' | jq '.'
echo ""
echo ""

# Test 6: Time Anomaly (Transaction at unusual hour)
echo "Test 6: Time Anomaly"
echo "----------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_time_anomaly_001",
    "userId": "user_123",
    "amount": 500.0,
    "merchantId": "merchant_groceries",
    "merchantCategory": "groceries",
    "timestamp": "2024-01-15T03:00:00",
    "deviceId": "device_known_123",
    "locationState": "CA",
    "locationCountry": "US"
  }' | jq '.'
echo ""
echo ""

# Test 7: Check Alerts
echo "Test 7: Check Generated Alerts"
echo "----------------------------------------"
curl -s "$BASE_URL/../alerts" | jq '.'
echo ""
echo ""

# Test 8: ML Service Health
echo "Test 8: ML Service Health Check"
echo "----------------------------------------"
curl -s "$ML_URL/health" | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
