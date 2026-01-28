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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
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
            @RequestParam(required = false, defaultValue = "15") int size,
            @RequestParam(required = false) String riskCategory) {
        
        Page<Transaction> transactionPage;
        
        if (riskCategory != null && !riskCategory.isEmpty() && !riskCategory.equals("all")) {
            transactionPage = transactionRepository.findByRiskCategoryOrderByTimestampDesc(
                riskCategory, 
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
            );
        } else {
            transactionPage = transactionRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
            );
        }
        
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
    
    @GetMapping("/{transactionId}")
    public ResponseEntity<FraudEvaluationResponse> getTransactionById(
            @PathVariable String transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));
        
        FraudEvaluationResponse response = mapToResponse(transaction);
        // Add full transaction details
        response.setUserId(transaction.getUserId());
        response.setAmount(transaction.getAmount().doubleValue());
        response.setMerchantId(transaction.getMerchantId());
        response.setMerchantCategory(transaction.getMerchantCategory());
        response.setDeviceId(transaction.getDeviceId());
        response.setLocationState(transaction.getLocationState());
        response.setLocationCountry(transaction.getLocationCountry());
        response.setTimestamp(transaction.getTimestamp().toString());
        response.setChannel(transaction.getChannel());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/timeseries")
    public ResponseEntity<Map<String, Object>> getTimeSeriesData(
            @RequestParam(required = false, defaultValue = "7") int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        
        List<Transaction> transactions = transactionRepository.findAll()
            .stream()
            .filter(t -> t.getTimestamp().isAfter(since))
            .collect(Collectors.toList());
        
        // Group by date
        Map<String, Map<String, Long>> dailyStats = transactions.stream()
            .collect(Collectors.groupingBy(
                t -> t.getTimestamp().toLocalDate().toString(),
                Collectors.groupingBy(
                    Transaction::getRiskCategory,
                    Collectors.counting()
                )
            ));
        
        // Format for frontend
        List<Map<String, Object>> series = dailyStats.entrySet().stream()
            .map(entry -> {
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("date", entry.getKey());
                dayData.put("approved", entry.getValue().getOrDefault("APPROVED", 0L));
                dayData.put("monitor", entry.getValue().getOrDefault("MONITOR", 0L));
                dayData.put("flagged", entry.getValue().getOrDefault("FLAGGED", 0L));
                dayData.put("total", entry.getValue().values().stream().mapToLong(Long::longValue).sum());
                return dayData;
            })
            .sorted(Comparator.comparing(m -> (String) m.get("date")))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(Map.of("data", series));
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchTransactions(
            @RequestParam(required = false) String transactionId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String merchantId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String riskCategory,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "15") int size) {
        
        Specification<Transaction> spec = Specification.where(null);
        
        if (transactionId != null && !transactionId.isEmpty()) {
            final String searchTerm = transactionId.toLowerCase();
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("transactionId")), "%" + searchTerm + "%"));
        }
        if (userId != null && !userId.isEmpty()) {
            final String searchTerm = userId.toLowerCase();
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("userId")), "%" + searchTerm + "%"));
        }
        if (merchantId != null && !merchantId.isEmpty()) {
            final String searchTerm = merchantId.toLowerCase();
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("merchantId")), "%" + searchTerm + "%"));
        }
        if (startDate != null && !startDate.isEmpty()) {
            try {
                LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
                spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), start));
            } catch (Exception e) {
                log.warn("Invalid startDate format: {}", startDate);
            }
        }
        if (endDate != null && !endDate.isEmpty()) {
            try {
                LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
                spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), end));
            } catch (Exception e) {
                log.warn("Invalid endDate format: {}", endDate);
            }
        }
        if (riskCategory != null && !riskCategory.isEmpty() && !riskCategory.equals("all")) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("riskCategory"), riskCategory));
        }
        
        Page<Transaction> transactionPage = transactionRepository.findAll(
            spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp")));
        
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
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserTransactions(
            @PathVariable String userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTimestampDesc(userId);
        
        List<FraudEvaluationResponse> responses = transactions.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        
        // Calculate user stats
        long total = transactions.size();
        long approved = transactions.stream().filter(t -> "APPROVED".equals(t.getRiskCategory())).count();
        long monitor = transactions.stream().filter(t -> "MONITOR".equals(t.getRiskCategory())).count();
        long flagged = transactions.stream().filter(t -> "FLAGGED".equals(t.getRiskCategory())).count();
        
        double avgAmount = transactions.stream()
            .mapToDouble(t -> t.getAmount().doubleValue())
            .average()
            .orElse(0.0);
        
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("transactions", responses);
        result.put("stats", Map.of(
            "total", total,
            "approved", approved,
            "monitor", monitor,
            "flagged", flagged,
            "avgAmount", avgAmount
        ));
        
        return ResponseEntity.ok(result);
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
            .explanation(transaction.getExplanation() != null ? transaction.getExplanation() : "No explanation available")
            .userId(transaction.getUserId())
            .amount(transaction.getAmount() != null ? transaction.getAmount().doubleValue() : null)
            .merchantId(transaction.getMerchantId())
            .merchantCategory(transaction.getMerchantCategory())
            .deviceId(transaction.getDeviceId())
            .locationState(transaction.getLocationState())
            .locationCountry(transaction.getLocationCountry())
            .timestamp(transaction.getTimestamp() != null ? transaction.getTimestamp().toString() : null)
            .channel(transaction.getChannel())
            .build();
        return response;
    }
}
