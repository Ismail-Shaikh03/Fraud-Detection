package com.fraud.controller;

import com.fraud.repository.TransactionRepository;
import com.fraud.repository.AlertRepository;
import com.fraud.repository.UserBaselineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
    
    private final TransactionRepository transactionRepository;
    private final AlertRepository alertRepository;
    private final UserBaselineRepository userBaselineRepository;
    
    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<Map<String, Object>> resetData() {
        log.warn("Admin reset endpoint called - clearing all data");
        
        try {
            // Get counts before deletion for response
            long transactionCount = transactionRepository.count();
            long alertCount = alertRepository.count();
            long baselineCount = userBaselineRepository.count();
            
            // Delete all records (in order to respect foreign key constraints)
            alertRepository.deleteAll();
            transactionRepository.deleteAll();
            userBaselineRepository.deleteAll();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "All data has been reset");
            result.put("deleted", Map.of(
                "transactions", transactionCount,
                "alerts", alertCount,
                "userBaselines", baselineCount
            ));
            
            log.info("Reset completed: {} transactions, {} alerts, {} baselines deleted",
                transactionCount, alertCount, baselineCount);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error during data reset", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
