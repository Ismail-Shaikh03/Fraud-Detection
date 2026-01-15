package com.fraud.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    @Id
    @Column(name = "transaction_id")
    private String transactionId;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "merchant_id", nullable = false)
    private String merchantId;
    
    @Column(name = "merchant_category", nullable = false)
    private String merchantCategory;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "device_id", nullable = false)
    private String deviceId;
    
    @Column(name = "location_state", nullable = false)
    private String locationState;
    
    @Column(name = "location_country", nullable = false)
    private String locationCountry;
    
    @Column(name = "channel")
    private String channel;
    
    @Column(name = "risk_score")
    private Double riskScore;
    
    @Column(name = "risk_category")
    private String riskCategory;
    
    @Column(name = "is_fraud")
    private Boolean isFraud; // Ground truth for evaluation
    
    @Column(name = "triggered_rules", columnDefinition = "TEXT")
    private String triggeredRules; // JSON string of triggered rules
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
