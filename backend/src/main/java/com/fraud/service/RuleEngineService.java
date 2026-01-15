package com.fraud.service;

import com.fraud.config.FraudDetectionConfig;
import com.fraud.dto.FraudEvaluationResponse.TriggeredRule;
import com.fraud.entity.Transaction;
import com.fraud.entity.UserBaseline;
import com.fraud.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RuleEngineService {
    
    private final TransactionRepository transactionRepository;
    private final FraudDetectionConfig config;
    
    private static final Set<String> RISKY_CATEGORIES = Set.of(
        "electronics", "crypto", "gift_cards", "jewelry", 
        "luxury_goods", "prepaid_cards"
    );
    
    private static final Map<String, Double> RULE_WEIGHTS = Map.of(
        "amount_anomaly", 25.0,
        "velocity_spike", 20.0,
        "geographic_anomaly", 15.0,
        "new_device", 10.0,
        "new_merchant_high_amount", 15.0,
        "risky_category", 10.0,
        "time_anomaly", 10.0
    );
    
    public RuleEvaluationResult evaluateRules(Transaction transaction, UserBaseline baseline) {
        List<TriggeredRule> triggeredRules = new ArrayList<>();
        double totalScore = 0.0;
        
        // Rule 1: Amount anomaly
        if (baseline.getTransactionCount() > 0 && baseline.getStdAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal zScore = transaction.getAmount()
                .subtract(baseline.getAvgAmount())
                .divide(baseline.getStdAmount(), 10, RoundingMode.HALF_UP);
            
            if (zScore.compareTo(BigDecimal.valueOf(config.getRules().getAmountAnomalyStdDev())) > 0) {
                double points = RULE_WEIGHTS.get("amount_anomaly");
                totalScore += points;
                triggeredRules.add(TriggeredRule.builder()
                    .ruleName("amount_anomaly")
                    .points(points)
                    .explanation(String.format(
                        "Transaction amount (%.2f) is %.2f standard deviations above user average (%.2f)",
                        transaction.getAmount().doubleValue(),
                        zScore.doubleValue(),
                        baseline.getAvgAmount().doubleValue()
                    ))
                    .build());
            }
        }
        
        // Rule 2: Velocity spike
        LocalDateTime since = transaction.getTimestamp()
            .minusMinutes(config.getRules().getVelocityWindowMinutes());
        Long velocityCount = transactionRepository.countRecentTransactions(
            transaction.getUserId(), since);
        
        if (velocityCount >= config.getRules().getVelocityThreshold()) {
            double points = RULE_WEIGHTS.get("velocity_spike");
            totalScore += points;
            triggeredRules.add(TriggeredRule.builder()
                .ruleName("velocity_spike")
                .points(points)
                .explanation(String.format(
                    "%d transactions in the last %d minutes (threshold: %d)",
                    velocityCount, config.getRules().getVelocityWindowMinutes(),
                    config.getRules().getVelocityThreshold()
                ))
                .build());
        }
        
        // Rule 3: Geographic anomaly
        if (baseline.getLastTransactionTime() != null) {
            boolean stateMatch = transaction.getLocationState()
                .equals(baseline.getLastTransactionState());
            boolean countryMatch = transaction.getLocationCountry()
                .equals(baseline.getLastTransactionCountry());
            
            if (!stateMatch || !countryMatch) {
                Duration timeDiff = Duration.between(
                    baseline.getLastTransactionTime(), transaction.getTimestamp());
                double hoursDiff = timeDiff.toHours();
                
                if (hoursDiff < config.getRules().getGeographicTimeWindowHours()) {
                    double points = RULE_WEIGHTS.get("geographic_anomaly");
                    totalScore += points;
                    triggeredRules.add(TriggeredRule.builder()
                        .ruleName("geographic_anomaly")
                        .points(points)
                        .explanation(String.format(
                            "Transaction from %s, %s within %.1f hours of last transaction from %s, %s",
                            transaction.getLocationState(), transaction.getLocationCountry(),
                            hoursDiff, baseline.getLastTransactionState(),
                            baseline.getLastTransactionCountry()
                        ))
                        .build());
                }
            }
        }
        
        // Rule 4: New device
        Set<String> knownDevices = parseJsonSet(baseline.getKnownDevices());
        if (!knownDevices.contains(transaction.getDeviceId())) {
            double points = RULE_WEIGHTS.get("new_device");
            totalScore += points;
            triggeredRules.add(TriggeredRule.builder()
                .ruleName("new_device")
                .points(points)
                .explanation("Transaction from new device: " + transaction.getDeviceId())
                .build());
        }
        
        // Rule 5: New merchant + high amount
        Set<String> knownMerchants = parseJsonSet(baseline.getKnownMerchants());
        if (!knownMerchants.contains(transaction.getMerchantId()) && 
            baseline.getTransactionCount() > 0) {
            BigDecimal threshold = baseline.getAvgAmount().multiply(BigDecimal.valueOf(2));
            if (transaction.getAmount().compareTo(threshold) > 0) {
                double points = RULE_WEIGHTS.get("new_merchant_high_amount");
                totalScore += points;
                triggeredRules.add(TriggeredRule.builder()
                    .ruleName("new_merchant_high_amount")
                    .points(points)
                    .explanation(String.format(
                        "New merchant (%s) with amount (%.2f) 2x above average (%.2f)",
                        transaction.getMerchantId(),
                        transaction.getAmount().doubleValue(),
                        baseline.getAvgAmount().doubleValue()
                    ))
                    .build());
            }
        }
        
        // Rule 6: Risky category
        if (RISKY_CATEGORIES.contains(transaction.getMerchantCategory().toLowerCase())) {
            double points = RULE_WEIGHTS.get("risky_category");
            totalScore += points;
            triggeredRules.add(TriggeredRule.builder()
                .ruleName("risky_category")
                .points(points)
                .explanation("Transaction in risky category: " + transaction.getMerchantCategory())
                .build());
        }
        
        // Rule 7: Time anomaly
        if (baseline.getMostCommonHour() != null) {
            int transactionHour = transaction.getTimestamp().getHour();
            int hourDiff = Math.abs(transactionHour - baseline.getMostCommonHour());
            if (hourDiff > 6 && hourDiff < 18) {
                double points = RULE_WEIGHTS.get("time_anomaly");
                totalScore += points;
                triggeredRules.add(TriggeredRule.builder()
                    .ruleName("time_anomaly")
                    .points(points)
                    .explanation(String.format(
                        "Transaction at %d:00, user typically transacts at %d:00",
                        transactionHour, baseline.getMostCommonHour()
                    ))
                    .build());
            }
        }
        
        // Normalize to 0-100
        totalScore = Math.min(100.0, Math.max(0.0, totalScore));
        
        return new RuleEvaluationResult(totalScore, triggeredRules, velocityCount.intValue());
    }
    
    private Set<String> parseJsonSet(String json) {
        if (json == null || json.isEmpty()) {
            return new HashSet<>();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = 
                new com.fasterxml.jackson.databind.ObjectMapper();
            List<String> list = mapper.readValue(json, 
                new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
            return new HashSet<>(list);
        } catch (Exception e) {
            return new HashSet<>();
        }
    }
    
    public static class RuleEvaluationResult {
        public final double ruleScore;
        public final List<TriggeredRule> triggeredRules;
        public final int velocityCount;
        
        public RuleEvaluationResult(double ruleScore, List<TriggeredRule> triggeredRules, int velocityCount) {
            this.ruleScore = ruleScore;
            this.triggeredRules = triggeredRules;
            this.velocityCount = velocityCount;
        }
    }
}
