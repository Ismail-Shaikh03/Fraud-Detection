package com.fraud.service;

import com.fraud.config.FraudDetectionConfig;
import com.fraud.dto.MLScoreRequest;
import com.fraud.dto.MLScoreResponse;
import com.fraud.entity.Transaction;
import com.fraud.entity.UserBaseline;
import com.fraud.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLScoringClient {
    
    private final WebClient.Builder webClientBuilder;
    private final FraudDetectionConfig config;
    private final TransactionRepository transactionRepository;
    
    public MLScoreResponse getMLScore(Transaction transaction, UserBaseline baseline) {
        try {
            MLScoreRequest request = buildMLScoreRequest(transaction, baseline);
            
            MLScoreResponse response = webClientBuilder.build()
                .post()
                .uri(config.getMl().getServiceUrl() + "/score")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(MLScoreResponse.class)
                .timeout(Duration.ofSeconds(config.getMl().getTimeoutSeconds()))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1))
                    .filter(throwable -> !(throwable instanceof java.util.concurrent.TimeoutException)))
                .block();
            
            return response != null ? response : getFallbackScore(transaction, baseline);
        } catch (Exception e) {
            log.warn("ML service call failed, using fallback score: {}", e.getMessage());
            return getFallbackScore(transaction, baseline);
        }
    }
    
    private MLScoreRequest buildMLScoreRequest(Transaction transaction, UserBaseline baseline) {
        // Calculate velocity (transactions in last 10 minutes)
        LocalDateTime since = transaction.getTimestamp().minusMinutes(10);
        Long velocity10m = transactionRepository.countRecentTransactions(
            transaction.getUserId(), since);
        
        // Calculate distance (simplified - binary for now)
        double distanceKm = 0.0;
        if (baseline.getLastTransactionState() != null) {
            if (!transaction.getLocationState().equals(baseline.getLastTransactionState()) ||
                !transaction.getLocationCountry().equals(baseline.getLastTransactionCountry())) {
                distanceKm = 1000.0; // Simplified large distance
            }
        }
        
        // Check if new device
        Set<String> knownDevices = parseJsonSet(baseline.getKnownDevices());
        int isNewDevice = knownDevices.contains(transaction.getDeviceId()) ? 0 : 1;
        
        // Check if new merchant
        Set<String> knownMerchants = parseJsonSet(baseline.getKnownMerchants());
        int isNewMerchant = knownMerchants.contains(transaction.getMerchantId()) ? 0 : 1;
        
        return new MLScoreRequest(
            transaction.getAmount(),
            transaction.getTimestamp().getHour(),
            velocity10m.intValue(),
            distanceKm,
            isNewDevice,
            isNewMerchant,
            transaction.getMerchantCategory()
        );
    }
    
    private MLScoreResponse getFallbackScore(Transaction transaction, UserBaseline baseline) {
        // Simple heuristic fallback
        double score = 0.0;
        if (baseline.getTransactionCount() == 0) {
            score = 0.5;
        } else {
            if (baseline.getStdAmount().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal z = transaction.getAmount()
                    .subtract(baseline.getAvgAmount())
                    .divide(baseline.getStdAmount(), 10, java.math.RoundingMode.HALF_UP);
                score += Math.min(0.4, Math.abs(z.doubleValue()) / 10.0);
            }
            Set<String> devices = parseJsonSet(baseline.getKnownDevices());
            if (!devices.contains(transaction.getDeviceId())) {
                score += 0.2;
            }
        }
        return new MLScoreResponse(Math.min(1.0, score), "fallback_v1", null);
    }
    
    private Set<String> parseJsonSet(String json) {
        if (json == null || json.isEmpty()) {
            return new HashSet<>();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = 
                new com.fasterxml.jackson.databind.ObjectMapper();
            return new java.util.HashSet<>(mapper.readValue(json, 
                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {}));
        } catch (Exception e) {
            return new HashSet<>();
        }
    }
}
