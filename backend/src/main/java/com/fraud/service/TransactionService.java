package com.fraud.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fraud.config.FraudDetectionConfig;
import com.fraud.dto.FraudEvaluationResponse;
import com.fraud.dto.TransactionRequest;
import com.fraud.entity.Alert;
import com.fraud.entity.Transaction;
import com.fraud.repository.AlertRepository;
import com.fraud.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {
    
    private final TransactionRepository transactionRepository;
    private final FraudEvaluationService fraudEvaluationService;
    private final AlertRepository alertRepository;
    private final FraudDetectionConfig config;
    private final ObjectMapper objectMapper;
    
    @Transactional
    public FraudEvaluationResponse processTransaction(TransactionRequest request) {
        // Create transaction entity
        Transaction transaction = Transaction.builder()
            .transactionId(request.getTransactionId())
            .userId(request.getUserId())
            .amount(request.getAmount())
            .merchantId(request.getMerchantId())
            .merchantCategory(request.getMerchantCategory())
            .timestamp(request.getTimestamp())
            .deviceId(request.getDeviceId())
            .locationState(request.getLocationState())
            .locationCountry(request.getLocationCountry())
            .channel(request.getChannel())
            .isFraud(request.getIsFraud())
            .build();
        
        // Evaluate fraud
        FraudEvaluationResponse evaluation = fraudEvaluationService.evaluate(transaction);
        
        // Set risk score and category on transaction
        transaction.setRiskScore(evaluation.getRiskScore());
        transaction.setRiskCategory(evaluation.getRiskCategory());
        
        // Store explanation
        transaction.setExplanation(evaluation.getExplanation());
        
        // Serialize and store triggered rules as JSON
        try {
            if (evaluation.getTriggeredRules() != null && !evaluation.getTriggeredRules().isEmpty()) {
                String triggeredRulesJson = objectMapper.writeValueAsString(evaluation.getTriggeredRules());
                transaction.setTriggeredRules(triggeredRulesJson);
            } else {
                transaction.setTriggeredRules("[]");
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize triggered rules for transaction {}", 
                transaction.getTransactionId(), e);
            transaction.setTriggeredRules("[]");
        }
        
        // Save transaction
        transactionRepository.save(transaction);
        
        // Create alert if above hard threshold
        boolean alertCreated = false;
        if ("FLAGGED".equals(evaluation.getRiskCategory())) {
            if (!alertRepository.existsByTransactionId(transaction.getTransactionId())) {
                Alert alert = Alert.builder()
                    .transactionId(transaction.getTransactionId())
                    .userId(transaction.getUserId())
                    .riskScore(evaluation.getRiskScore())
                    .status(Alert.AlertStatus.NEW)
                    .build();
                alertRepository.save(alert);
                alertCreated = true;
                log.info("Alert created for transaction {} with risk score {}", 
                    transaction.getTransactionId(), evaluation.getRiskScore());
            }
        }
        
        evaluation.setAlertCreated(alertCreated);
        return evaluation;
    }
}
