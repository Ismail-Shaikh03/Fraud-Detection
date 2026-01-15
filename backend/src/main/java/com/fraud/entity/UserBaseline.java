package com.fraud.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_baselines")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBaseline {
    @Id
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "transaction_count", nullable = false)
    private Integer transactionCount = 0;
    
    @Column(name = "avg_amount", precision = 19, scale = 2)
    private BigDecimal avgAmount = BigDecimal.ZERO;
    
    @Column(name = "std_amount", precision = 19, scale = 2)
    private BigDecimal stdAmount = BigDecimal.ZERO;
    
    @Column(name = "min_amount", precision = 19, scale = 2)
    private BigDecimal minAmount;
    
    @Column(name = "max_amount", precision = 19, scale = 2)
    private BigDecimal maxAmount = BigDecimal.ZERO;
    
    @Column(name = "most_common_hour")
    private Integer mostCommonHour;
    
    @Column(name = "hour_distribution", columnDefinition = "TEXT")
    private String hourDistribution; // JSON string
    
    @Column(name = "merchant_categories", columnDefinition = "TEXT")
    private String merchantCategories; // JSON string
    
    @Column(name = "known_merchants", columnDefinition = "TEXT")
    private String knownMerchants; // JSON string
    
    @Column(name = "location_states", columnDefinition = "TEXT")
    private String locationStates; // JSON string
    
    @Column(name = "location_countries", columnDefinition = "TEXT")
    private String locationCountries; // JSON string
    
    @Column(name = "known_devices", columnDefinition = "TEXT")
    private String knownDevices; // JSON string
    
    @Column(name = "last_transaction_time")
    private LocalDateTime lastTransactionTime;
    
    @Column(name = "last_transaction_state")
    private String lastTransactionState;
    
    @Column(name = "last_transaction_country")
    private String lastTransactionCountry;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
