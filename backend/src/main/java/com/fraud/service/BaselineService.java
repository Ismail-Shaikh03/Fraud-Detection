package com.fraud.service;

import com.fraud.entity.Transaction;
import com.fraud.entity.UserBaseline;
import com.fraud.repository.UserBaselineRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BaselineService {
    
    private final UserBaselineRepository baselineRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MathContext mathContext = new MathContext(10, RoundingMode.HALF_UP);
    
    @Transactional
    public UserBaseline getOrCreateBaseline(String userId) {
        return baselineRepository.findById(userId)
            .orElseGet(() -> {
                UserBaseline baseline = UserBaseline.builder()
                    .userId(userId)
                    .transactionCount(0)
                    .avgAmount(BigDecimal.ZERO)
                    .stdAmount(BigDecimal.ZERO)
                    .maxAmount(BigDecimal.ZERO)
                    .build();
                return baselineRepository.save(baseline);
            });
    }
    
    @Transactional
    public void updateBaseline(Transaction transaction) {
        UserBaseline baseline = getOrCreateBaseline(transaction.getUserId());
        int n = baseline.getTransactionCount() + 1;
        
        // Update amount statistics using Welford's online algorithm
        BigDecimal amount = transaction.getAmount();
        if (n == 1) {
            baseline.setAvgAmount(amount);
            baseline.setStdAmount(BigDecimal.ZERO);
            baseline.setMinAmount(amount);
            baseline.setMaxAmount(amount);
        } else {
            BigDecimal oldAvg = baseline.getAvgAmount();
            BigDecimal newAvg = oldAvg.add(
                amount.subtract(oldAvg).divide(BigDecimal.valueOf(n), mathContext)
            );
            baseline.setAvgAmount(newAvg);
            
            if (n > 1) {
                BigDecimal variance = baseline.getStdAmount()
                    .multiply(baseline.getStdAmount())
                    .multiply(BigDecimal.valueOf(n - 2))
                    .add(amount.subtract(oldAvg).multiply(amount.subtract(newAvg)))
                    .divide(BigDecimal.valueOf(n - 1), mathContext);
                
                baseline.setStdAmount(variance.max(BigDecimal.ZERO)
                    .sqrt(mathContext));
            }
            
            if (baseline.getMinAmount() == null || amount.compareTo(baseline.getMinAmount()) < 0) {
                baseline.setMinAmount(amount);
            }
            if (amount.compareTo(baseline.getMaxAmount()) > 0) {
                baseline.setMaxAmount(amount);
            }
        }
        
        // Update time statistics
        int hour = transaction.getTimestamp().getHour();
        Map<String, Object> hourDistRaw = parseJsonMap(baseline.getHourDistribution(), Object.class);
        Map<Integer, Integer> hourDist = new HashMap<>();
        for (Map.Entry<String, Object> entry : hourDistRaw.entrySet()) {
            hourDist.put(Integer.parseInt(entry.getKey()), ((Number) entry.getValue()).intValue());
        }
        hourDist.put(hour, hourDist.getOrDefault(hour, 0) + 1);
        baseline.setHourDistribution(toJsonString(hourDist));
        baseline.setMostCommonHour(hourDist.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null));
        
        // Update merchant categories
        Map<String, Object> categoriesRaw = parseJsonMap(baseline.getMerchantCategories(), Object.class);
        Map<String, Integer> categories = new HashMap<>();
        for (Map.Entry<String, Object> entry : categoriesRaw.entrySet()) {
            categories.put(entry.getKey(), ((Number) entry.getValue()).intValue());
        }
        categories.put(transaction.getMerchantCategory(),
            categories.getOrDefault(transaction.getMerchantCategory(), 0) + 1);
        baseline.setMerchantCategories(toJsonString(categories));
        
        // Update known merchants
        Set<String> merchants = parseJsonSet(baseline.getKnownMerchants(), String.class);
        merchants.add(transaction.getMerchantId());
        baseline.setKnownMerchants(toJsonString(merchants));
        
        // Update location statistics
        Map<String, Object> statesRaw = parseJsonMap(baseline.getLocationStates(), Object.class);
        Map<String, Integer> states = new HashMap<>();
        for (Map.Entry<String, Object> entry : statesRaw.entrySet()) {
            states.put(entry.getKey(), ((Number) entry.getValue()).intValue());
        }
        states.put(transaction.getLocationState(),
            states.getOrDefault(transaction.getLocationState(), 0) + 1);
        baseline.setLocationStates(toJsonString(states));
        
        Map<String, Object> countriesRaw = parseJsonMap(baseline.getLocationCountries(), Object.class);
        Map<String, Integer> countries = new HashMap<>();
        for (Map.Entry<String, Object> entry : countriesRaw.entrySet()) {
            countries.put(entry.getKey(), ((Number) entry.getValue()).intValue());
        }
        countries.put(transaction.getLocationCountry(),
            countries.getOrDefault(transaction.getLocationCountry(), 0) + 1);
        baseline.setLocationCountries(toJsonString(countries));
        
        // Update known devices
        Set<String> devices = parseJsonSet(baseline.getKnownDevices(), String.class);
        devices.add(transaction.getDeviceId());
        baseline.setKnownDevices(toJsonString(devices));
        
        // Update last transaction info
        baseline.setLastTransactionTime(transaction.getTimestamp());
        baseline.setLastTransactionState(transaction.getLocationState());
        baseline.setLastTransactionCountry(transaction.getLocationCountry());
        
        baseline.setTransactionCount(n);
        baselineRepository.save(baseline);
    }
    
    private <T> Map<String, T> parseJsonMap(String json, Class<T> valueType) {
        if (json == null || json.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, T>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse JSON map: {}", json, e);
            return new HashMap<>();
        }
    }
    
    private <T> Set<T> parseJsonSet(String json, Class<T> elementType) {
        if (json == null || json.isEmpty()) {
            return new HashSet<>();
        }
        try {
            List<T> list = objectMapper.readValue(json, new TypeReference<List<T>>() {});
            return new HashSet<>(list);
        } catch (Exception e) {
            log.warn("Failed to parse JSON set: {}", json, e);
            return new HashSet<>();
        }
    }
    
    private String toJsonString(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to serialize to JSON", e);
            return "{}";
        }
    }
}
