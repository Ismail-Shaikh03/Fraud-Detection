package com.fraud.service;

import com.fraud.config.FraudDetectionConfig;
import com.fraud.dto.FraudEvaluationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskAggregatorService {
    
    private final FraudDetectionConfig config;
    
    public FraudEvaluationResponse aggregate(
            double ruleScore,
            double statisticalScore,
            Double mlScore,
            String transactionId,
            RuleEngineService.RuleEvaluationResult ruleResult) {
        
        // Convert ML score to 0-100 range if present
        Double mlScore100 = mlScore != null ? mlScore * 100.0 : null;
        
        // Weighted aggregation
        double finalScore;
        if (mlScore100 != null) {
            finalScore = config.getScoring().getRuleWeight() * ruleScore +
                        config.getScoring().getStatisticalWeight() * statisticalScore +
                        config.getScoring().getMlWeight() * mlScore100;
        } else {
            // Adjust weights if ML is not available
            double totalWeight = config.getScoring().getRuleWeight() + 
                               config.getScoring().getStatisticalWeight();
            finalScore = (config.getScoring().getRuleWeight() / totalWeight) * ruleScore +
                        (config.getScoring().getStatisticalWeight() / totalWeight) * statisticalScore;
        }
        
        // Ensure score is in 0-100 range
        finalScore = Math.min(100.0, Math.max(0.0, finalScore));
        
        // Determine risk category
        String riskCategory;
        if (finalScore < config.getThresholds().getSoftFlag()) {
            riskCategory = "APPROVED";
        } else if (finalScore < config.getThresholds().getHardFlag()) {
            riskCategory = "MONITOR";
        } else {
            riskCategory = "FLAGGED";
        }
        
        // Generate explanation
        StringBuilder explanation = new StringBuilder();
        explanation.append(String.format("Risk Score: %.1f/100 (%s)\n", finalScore, riskCategory));
        explanation.append(String.format("Rule-based signals: %.1f points\n", ruleScore));
        explanation.append(String.format("Statistical deviation: %.1f points\n", statisticalScore));
        if (mlScore100 != null) {
            explanation.append(String.format("ML anomaly: %.1f points\n", mlScore100));
        }
        
        if (!ruleResult.triggeredRules.isEmpty()) {
            explanation.append(String.format("\nTriggered Rules (%d):\n", 
                ruleResult.triggeredRules.size()));
            for (var rule : ruleResult.triggeredRules) {
                explanation.append(String.format("  - %s: %s\n", rule.getRuleName(), rule.getExplanation()));
            }
        } else {
            explanation.append("\nNo fraud rules triggered");
        }
        
        return FraudEvaluationResponse.builder()
            .transactionId(transactionId)
            .riskScore(finalScore)
            .riskCategory(riskCategory)
            .ruleScore(ruleScore)
            .statisticalScore(statisticalScore)
            .mlScore(mlScore100)
            .zScore(null) // Will be set by caller
            .velocityCount(ruleResult.velocityCount)
            .triggeredRules(ruleResult.triggeredRules)
            .explanation(explanation.toString())
            .build();
    }
}
