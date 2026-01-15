CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    merchant_id VARCHAR(255) NOT NULL,
    merchant_category VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    location_state VARCHAR(255) NOT NULL,
    location_country VARCHAR(255) NOT NULL,
    channel VARCHAR(255),
    risk_score DOUBLE PRECISION,
    risk_category VARCHAR(50),
    is_fraud BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_user_timestamp ON transactions(user_id, timestamp);

CREATE TABLE IF NOT EXISTS user_baselines (
    user_id VARCHAR(255) PRIMARY KEY,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    avg_amount DECIMAL(19, 2),
    std_amount DECIMAL(19, 2),
    min_amount DECIMAL(19, 2),
    max_amount DECIMAL(19, 2),
    most_common_hour INTEGER,
    hour_distribution TEXT,
    merchant_categories TEXT,
    known_merchants TEXT,
    location_states TEXT,
    location_countries TEXT,
    known_devices TEXT,
    last_transaction_time TIMESTAMP,
    last_transaction_state VARCHAR(255),
    last_transaction_country VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    analyst_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
