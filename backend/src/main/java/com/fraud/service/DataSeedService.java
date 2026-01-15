package com.fraud.service;

import com.fraud.dto.TransactionRequest;
import com.fraud.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSeedService {
    
    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    
    private static final String[] USER_IDS = {
        "user_001", "user_002", "user_003", "user_004", "user_005",
        "user_006", "user_007", "user_008", "user_009", "user_010"
    };
    
    private static final String[] MERCHANT_CATEGORIES = {
        "groceries", "restaurant", "gas", "retail", "electronics",
        "crypto", "gift_cards", "jewelry", "hotel", "travel"
    };
    
    private static final String[] STATES = {"CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"};
    private static final String[] RISKY_CATEGORIES = {"crypto", "gift_cards", "jewelry"};
    
    @Transactional
    public Map<String, Object> generateTransactions(int count) {
        log.info("Starting to generate {} transactions", count);
        long startTime = System.currentTimeMillis();
        
        int approved = 0, monitor = 0, flagged = 0;
        int errors = 0;
        
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 0; i < count; i++) {
            try {
                TransactionRequest request = generateRandomTransaction(i, now);
                var response = transactionService.processTransaction(request);
                
                switch (response.getRiskCategory()) {
                    case "APPROVED":
                        approved++;
                        break;
                    case "MONITOR":
                        monitor++;
                        break;
                    case "FLAGGED":
                        flagged++;
                        break;
                }
                
                if ((i + 1) % 100 == 0) {
                    log.info("Processed {}/{} transactions", i + 1, count);
                }
                
                // Small delay to avoid overwhelming the system
                if (i % 10 == 0) {
                    Thread.sleep(10);
                }
            } catch (Exception e) {
                log.error("Error generating transaction {}: {}", i, e.getMessage());
                errors++;
            }
        }
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        Map<String, Object> result = new HashMap<>();
        result.put("total", count);
        result.put("approved", approved);
        result.put("monitor", monitor);
        result.put("flagged", flagged);
        result.put("errors", errors);
        result.put("durationMs", duration);
        result.put("message", String.format("Generated %d transactions in %d ms", count, duration));
        
        log.info("Completed generating {} transactions: {} approved, {} monitor, {} flagged, {} errors",
            count, approved, monitor, flagged, errors);
        
        return result;
    }
    
    private TransactionRequest generateRandomTransaction(int index, LocalDateTime now) {
        Random random = ThreadLocalRandom.current();
        String userId = USER_IDS[random.nextInt(USER_IDS.length)];
        
        // Decide transaction type (70% normal, 20% monitor, 10% flagged)
        double type = random.nextDouble();
        boolean isRisky = type > 0.9;  // 10% flagged
        boolean isMonitor = type > 0.7 && !isRisky;  // 20% monitor
        
        BigDecimal amount;
        String merchantCategory;
        String deviceId;
        String locationState;
        
        if (isRisky) {
            // High-risk: large amount, risky category, possibly new device
            amount = BigDecimal.valueOf(5000 + random.nextDouble() * 50000)
                .setScale(2, RoundingMode.HALF_UP);
            merchantCategory = RISKY_CATEGORIES[random.nextInt(RISKY_CATEGORIES.length)];
            deviceId = random.nextBoolean() ? "device_new_" + random.nextInt(100) : "device_known_" + userId.substring(5);
            locationState = STATES[random.nextInt(STATES.length)];
        } else if (isMonitor) {
            // Medium-risk: moderate-high amount, new merchant, or velocity
            amount = BigDecimal.valueOf(200 + random.nextDouble() * 3000)
                .setScale(2, RoundingMode.HALF_UP);
            merchantCategory = MERCHANT_CATEGORIES[random.nextInt(MERCHANT_CATEGORIES.length)];
            deviceId = "device_known_" + userId.substring(5);
            locationState = random.nextBoolean() ? "CA" : STATES[random.nextInt(STATES.length)];
        } else {
            // Normal: typical amounts and patterns
            amount = BigDecimal.valueOf(10 + random.nextDouble() * 200)
                .setScale(2, RoundingMode.HALF_UP);
            merchantCategory = MERCHANT_CATEGORIES[random.nextInt(MERCHANT_CATEGORIES.length - 3)]; // Exclude risky
            deviceId = "device_known_" + userId.substring(5);
            locationState = "CA";
        }
        
        // Generate timestamp spread over the last 30 days
        long daysAgo = random.nextInt(30);
        long hoursAgo = random.nextInt(24);
        long minutesAgo = random.nextInt(60);
        LocalDateTime timestamp = now
            .minusDays(daysAgo)
            .minusHours(hoursAgo)
            .minusMinutes(minutesAgo);
        
        return new TransactionRequest(
            "txn_seed_" + System.currentTimeMillis() + "_" + index,
            userId,
            amount,
            "merchant_" + random.nextInt(100),
            merchantCategory,
            timestamp,
            deviceId,
            locationState,
            "US",
            null,
            null
        );
    }
}
