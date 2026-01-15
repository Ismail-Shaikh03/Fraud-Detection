package com.fraud.service;

import com.fraud.dto.FraudEvaluationResponse;
import com.fraud.entity.Transaction;
import com.fraud.entity.UserBaseline;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudEvaluationService {
    
    private final BaselineService baselineService;
    private final RuleEngineService ruleEngineService;
    private final StatisticalScorerService statisticalScorerService;
    private final MLScoringClient mlScoringClient;
    private final RiskAggregatorService riskAggregatorService;
    
    @Transactional
    public FraudEvaluationResponse evaluate(Transaction transaction) {
        // Get user baseline
        UserBaseline baseline = baselineService.getOrCreateBaseline(transaction.getUserId());
        
        // 1. Rule-based evaluation
        RuleEngineService.RuleEvaluationResult ruleResult = 
            ruleEngineService.evaluateRules(transaction, baseline);
        
        // 2. Statistical deviation scoring
        StatisticalScorerService.StatisticalScoreResult statResult = 
            statisticalScorerService.computeScore(transaction, baseline);
        
        // 3. ML anomaly detection
        com.fraud.dto.MLScoreResponse mlResponse = 
            mlScoringClient.getMLScore(transaction, baseline);
        
        // 4. Aggregate scores
        FraudEvaluationResponse response = riskAggregatorService.aggregate(
            ruleResult.ruleScore,
            statResult.statisticalScore,
            mlResponse.getMlScore(),
            transaction.getTransactionId(),
            ruleResult
        );
        
        // Set z-score
        response.setZScore(statResult.zScore);
        
        // Update baseline with this transaction
        baselineService.updateBaseline(transaction);
        
        return response;
    }
}
