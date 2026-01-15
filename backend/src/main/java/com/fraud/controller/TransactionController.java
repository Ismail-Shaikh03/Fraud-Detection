package com.fraud.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fraud.dto.FraudEvaluationResponse;
import com.fraud.dto.TransactionRequest;
import com.fraud.entity.Transaction;
import com.fraud.repository.TransactionRepository;
import com.fraud.repository.AlertRepository;
import com.fraud.service.TransactionService;
import com.fraud.service.DataSeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {
    
    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    private final DataSeedService dataSeedService;
    private final AlertRepository alertRepository;
    private final ObjectMapper objectMapper;
    
    @PostMapping
    public ResponseEntity<FraudEvaluationResponse> processTransaction(
            @Valid @RequestBody TransactionRequest request) {
        FraudEvaluationResponse response = transactionService.processTransaction(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTransactions(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "25") int size) {
        
        Page<Transaction> transactionPage = transactionRepository.findAll(
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
        );
        
        List<FraudEvaluationResponse> responses = transactionPage.getContent().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("content", responses);
        result.put("page", transactionPage.getNumber());
        result.put("size", transactionPage.getSize());
        result.put("totalElements", transactionPage.getTotalElements());
        result.put("totalPages", transactionPage.getTotalPages());
        result.put("hasNext", transactionPage.hasNext());
        result.put("hasPrevious", transactionPage.hasPrevious());
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        List<Transaction> allTransactions = transactionRepository.findAll();
        
        long total = allTransactions.size();
        long approved = allTransactions.stream()
            .filter(t -> "APPROVED".equals(t.getRiskCategory()))
            .count();
        long monitor = allTransactions.stream()
            .filter(t -> "MONITOR".equals(t.getRiskCategory()))
            .count();
        long flagged = allTransactions.stream()
            .filter(t -> "FLAGGED".equals(t.getRiskCategory()))
            .count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("approved", approved);
        stats.put("monitor", monitor);
        stats.put("flagged", flagged);
        
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seedData(@RequestParam(required = false, defaultValue = "1000") int count) {
        try {
            Map<String, Object> result = dataSeedService.generateTransactions(count);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    private FraudEvaluationResponse mapToResponse(Transaction transaction) {
        boolean hasAlert = alertRepository.existsByTransactionId(transaction.getTransactionId());
        
        // Deserialize triggered rules from JSON
        List<FraudEvaluationResponse.TriggeredRule> triggeredRules = new ArrayList<>();
        if (transaction.getTriggeredRules() != null && !transaction.getTriggeredRules().isEmpty()) {
            try {
                triggeredRules = objectMapper.readValue(
                    transaction.getTriggeredRules(),
                    new TypeReference<List<FraudEvaluationResponse.TriggeredRule>>() {}
                );
            } catch (Exception e) {
                log.warn("Failed to deserialize triggered rules for transaction {}: {}", 
                    transaction.getTransactionId(), e.getMessage());
                triggeredRules = new ArrayList<>();
            }
        }
        
        FraudEvaluationResponse response = FraudEvaluationResponse.builder()
            .transactionId(transaction.getTransactionId())
            .riskScore(transaction.getRiskScore() != null ? transaction.getRiskScore() : 0.0)
            .riskCategory(transaction.getRiskCategory() != null ? transaction.getRiskCategory() : "APPROVED")
            .alertCreated(hasAlert)
            .triggeredRules(triggeredRules)
            .explanation("Transaction stored in database")
            .build();
        return response;
    }
}
