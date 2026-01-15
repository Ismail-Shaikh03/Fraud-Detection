# Fraud Detection System - Testing Guide

## Quick Test Commands

### 1. Check All Services Are Running
```bash
docker compose ps
```

### 2. Test ML Service Health
```bash
curl http://localhost:8000/health
```

### 3. Test Normal Transaction (Low Risk)
```bash
curl -X POST http://localhost:8080/api/transactions \
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
  }'
```

### 4. Test High-Risk Transaction
```bash
curl -X POST http://localhost:8080/api/transactions \
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
  }'
```

### 5. View All Alerts
```bash
curl http://localhost:8080/api/alerts
```

### 6. View Alerts by Status
```bash
curl "http://localhost:8080/api/alerts?status=NEW"
```

### 7. Update Alert Status
```bash
curl -X PUT http://localhost:8080/api/alerts/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INVESTIGATING",
    "analystNotes": "Reviewing transaction details"
  }'
```

## Automated Test Script

Run the comprehensive test script:
```bash
./test_transactions.sh
```

**Note:** Requires `jq` for JSON formatting. Install with:
- Mac: `brew install jq`
- Linux: `sudo apt-get install jq`

## Test Scenarios

### Scenario 1: Normal User Behavior
**Expected:** Low risk score (0-49), APPROVED

```json
{
  "transactionId": "txn_normal",
  "userId": "user_123",
  "amount": 50.0,
  "merchantId": "merchant_known",
  "merchantCategory": "groceries",
  "timestamp": "2024-01-15T14:00:00",
  "deviceId": "device_known",
  "locationState": "CA",
  "locationCountry": "US"
}
```

### Scenario 2: High-Risk Transaction
**Expected:** High risk score (80+), FLAGGED, Alert created

```json
{
  "transactionId": "txn_high_risk",
  "userId": "user_123",
  "amount": 15000.0,
  "merchantId": "merchant_new",
  "merchantCategory": "crypto",
  "timestamp": "2024-01-15T03:00:00",
  "deviceId": "device_new",
  "locationState": "NY",
  "locationCountry": "US"
}
```

### Scenario 3: Velocity Spike
**Expected:** Velocity rule triggered, increased risk

Send 5+ transactions within 5 minutes from the same user.

### Scenario 4: Amount Anomaly
**Expected:** Amount anomaly rule triggered

Send a transaction with amount > 3 standard deviations above user's average.

### Scenario 5: Geographic Anomaly
**Expected:** Geographic anomaly rule triggered

Send transaction from different state/country within 2 hours of last transaction.

## Understanding Risk Scores

- **0-49: APPROVED** - Low risk, transaction approved
- **50-79: MONITOR** - Medium risk, monitor for patterns
- **80-100: FLAGGED** - High risk, alert created for analyst review

## Testing ML Service Directly

```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000.0,
    "hourOfDay": 10,
    "velocity10m": 3,
    "distanceFromLastKm": 1000.0,
    "isNewDevice": 1,
    "isNewMerchant": 0,
    "merchantCategory": "electronics"
  }'
```

## Expected Response Format

```json
{
  "transactionId": "txn_001",
  "riskScore": 85.5,
  "riskCategory": "FLAGGED",
  "ruleScore": 50.0,
  "statisticalScore": 75.0,
  "mlScore": 80.0,
  "zScore": 3.5,
  "velocityCount": 1,
  "triggeredRules": [
    {
      "ruleName": "amount_anomaly",
      "points": 25.0,
      "explanation": "Transaction amount (5000.00) is 3.50 standard deviations above user average (100.00)"
    }
  ],
  "explanation": "Risk Score: 85.5/100 (FLAGGED)...",
  "alertCreated": true
}
```

## Monitoring

### View Backend Logs
```bash
docker compose logs -f backend
```

### View ML Service Logs
```bash
docker compose logs -f ml-service
```

### View PostgreSQL Logs
```bash
docker compose logs -f postgres
```

## Database Queries (Optional)

Connect to PostgreSQL:
```bash
docker compose exec postgres psql -U frauduser -d frauddb
```

Then run:
```sql
-- View all transactions
SELECT transaction_id, user_id, amount, risk_score, risk_category 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- View user baselines
SELECT user_id, transaction_count, avg_amount, std_amount 
FROM user_baselines;

-- View alerts
SELECT id, transaction_id, risk_score, status, created_at 
FROM alerts 
ORDER BY created_at DESC;
```
