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
