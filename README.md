# Fraud Detection System

A production-ready hybrid fraud detection system with Spring Boot backend and Python FastAPI ML microservice.

## Architecture

- **React Frontend** (Port 3000): Modern web dashboard for transaction monitoring, fraud analysis, and alert management
- **Spring Boot Service** (Port 8080): Transaction processing, rule-based scoring, statistical analysis, alerting
- **Python FastAPI Service** (Port 8000): ML anomaly detection using Isolation Forest
- **PostgreSQL**: Data persistence for transactions, user baselines, and alerts

## Features

### Fraud Detection Components

1. **Rule-Based Scoring**: 7 explainable fraud rules
   - Amount anomaly detection
   - Transaction velocity spikes
   - Geographic anomalies
   - New device detection
   - New merchant + high amount
   - Risky merchant categories
   - Time-of-day anomalies

2. **Statistical Deviation Scoring**: Z-score based risk assessment

3. **ML Anomaly Detection**: Isolation Forest model for unsupervised anomaly detection

4. **Risk Aggregation**: Weighted combination of all scores (configurable weights)

5. **Alert Management**: Automatic alert creation for high-risk transactions with analyst workflow

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Java 17+ (for local development)
- Python 3.11+ (for local development)
- Maven 3.9+ (for local development)

### Quick Start with Docker

1. **Train the ML Model** (first time only):
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python training/train_model.py
```

2. **Start All Services**:
```bash
docker-compose up -d
```

3. **Access the Dashboard**:
   - Open your browser and navigate to: `http://localhost:3000`
   - The dashboard provides a complete UI for:
     - Processing new transactions
     - Viewing transaction history with risk scores
     - Managing fraud alerts
     - Viewing risk distribution charts

4. **Check Service Health**:
```bash
# Backend health
curl http://localhost:8080/actuator/health

# ML Service health
curl http://localhost:8000/health

# Frontend is available at
# http://localhost:3000
```

### Local Development Setup

#### Frontend (React + TypeScript)

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Run development server**:
```bash
npm run dev
```

3. **Access the app**:
   - Development server runs on `http://localhost:3000`
   - Hot reload is enabled for development

4. **Build for production**:
```bash
npm run build
```

#### Backend (Spring Boot)

1. **Start PostgreSQL**:
```bash
docker-compose up -d postgres
```

2. **Update application.yml** if needed (database connection)

3. **Run the application**:
```bash
cd backend
mvn spring-boot:run
```

#### ML Service (Python)

1. **Create virtual environment**:
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Train the model** (first time):
```bash
python training/train_model.py
```

3. **Run the service**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Usage

### Process a Transaction

```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_001",
    "userId": "user_123",
    "amount": 5000.0,
    "merchantId": "merchant_abc",
    "merchantCategory": "electronics",
    "timestamp": "2024-01-15T10:30:00",
    "deviceId": "device_xyz",
    "locationState": "CA",
    "locationCountry": "US",
    "channel": "online"
  }'
```

**Response Example**:
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
    },
    {
      "ruleName": "risky_category",
      "points": 10.0,
      "explanation": "Transaction in risky category: electronics"
    }
  ],
  "explanation": "Risk Score: 85.5/100 (FLAGGED)\n...",
  "alertCreated": true
}
```

### Get Alerts

```bash
# Get all alerts
curl http://localhost:8080/api/alerts

# Get alerts by status
curl http://localhost:8080/api/alerts?status=NEW
```

### Update Alert Status

```bash
curl -X PUT http://localhost:8080/api/alerts/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INVESTIGATING",
    "analystNotes": "Reviewing transaction details"
  }'
```

### ML Service Direct Call

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

## Configuration

### Backend Configuration (`application.yml`)

```yaml
fraud:
  detection:
    scoring:
      rule-weight: 0.5        # Weight for rule-based scoring
      statistical-weight: 0.3  # Weight for statistical scoring
      ml-weight: 0.2          # Weight for ML scoring
    thresholds:
      soft-flag: 50.0         # Threshold for MONITOR category
      hard-flag: 80.0         # Threshold for FLAGGED category
    rules:
      velocity-threshold: 3           # Max transactions before flagging
      velocity-window-minutes: 5      # Time window for velocity check
      amount-anomaly-std-dev: 3.0    # Z-score threshold for amount anomaly
      geographic-time-window-hours: 2 # Time window for geographic anomaly
    ml:
      service-url: http://localhost:8000
      timeout-seconds: 5
```

## Database Schema

### Tables

- **transactions**: Stores all transaction records with risk scores
- **user_baselines**: Maintains rolling behavioral baselines per user
- **alerts**: Tracks high-risk transactions requiring analyst review

### Migrations

Database migrations are managed by Flyway. Initial schema is in:
`backend/src/main/resources/db/migration/V1__init_schema.sql`

## Risk Categories

- **APPROVED** (0-49): Low risk, transaction approved
- **MONITOR** (50-79): Medium risk, monitor for patterns
- **FLAGGED** (80-100): High risk, alert created for analyst review

## Development

### Project Structure

```
fraud-detection-system/
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API service layer
│   │   ├── types/              # TypeScript type definitions
│   │   └── styles/             # CSS and Tailwind styles
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/                    # Spring Boot service
│   ├── src/main/java/com/fraud/
│   │   ├── controller/         # REST controllers
│   │   ├── service/            # Business logic
│   │   ├── repository/         # Data access
│   │   ├── entity/             # JPA entities
│   │   ├── dto/                # Data transfer objects
│   │   └── config/             # Configuration classes
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/        # Flyway migrations
├── ml-service/                 # Python FastAPI service
│   ├── app/
│   │   ├── main.py             # FastAPI application
│   │   ├── models/             # Pydantic schemas
│   │   └── services/           # ML scoring logic
│   ├── training/               # Model training scripts
│   └── models/                 # Trained model storage
└── docker-compose.yml
```

### Adding New Fraud Rules

1. Add rule logic in `RuleEngineService.java`
2. Add rule weight to `RULE_WEIGHTS` map
3. Add rule explanation to triggered rules list

### Training New ML Models

1. Update `training/train_model.py` with new model architecture
2. Train: `python training/train_model.py`
3. Update model path in `MLScorer` class
4. Restart ML service

## Testing

### Test Transaction Examples

**Normal Transaction**:
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

**High-Risk Transaction**:
```json
{
  "transactionId": "txn_risky",
  "userId": "user_123",
  "amount": 10000.0,
  "merchantId": "merchant_new",
  "merchantCategory": "crypto",
  "timestamp": "2024-01-15T03:00:00",
  "deviceId": "device_new",
  "locationState": "NY",
  "locationCountry": "US"
}
```

## Troubleshooting

### ML Service Not Responding

- Check if model file exists: `ls ml-service/models/isolation_forest_v1.joblib`
- Train model if missing: `python ml-service/training/train_model.py`
- Check service logs: `docker logs fraud-ml-service`

### Database Connection Issues

- Verify PostgreSQL is running: `docker ps`
- Check connection string in `application.yml`
- Verify database credentials

### High Memory Usage

- Reduce training data size in `train_model.py`
- Adjust Isolation Forest `n_estimators` parameter
- Consider model quantization

## License

This is a demonstration project for educational purposes.
