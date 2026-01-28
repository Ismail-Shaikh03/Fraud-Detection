package com.fraud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudEvaluationResponse {
    private String transactionId;
    private Double riskScore; // 0-100
    private String riskCategory; // APPROVED, MONITOR, FLAGGED
    private Double ruleScore;
    private Double statisticalScore;
    private Double mlScore;
    private Double zScore;
    private Integer velocityCount;
    private List<TriggeredRule> triggeredRules;
    private String explanation;
    private Boolean alertCreated;
    
    // Additional fields for detail view
    private String userId;
    private Double amount;
    private String merchantId;
    private String merchantCategory;
    private String deviceId;
    private String locationState;
    private String locationCountry;
    private String timestamp;
    private String channel;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriggeredRule {
        private String ruleName;
        private Double points;
        private String explanation;
    }
}
