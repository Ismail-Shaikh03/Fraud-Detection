package com.fraud.service;

import com.fraud.entity.Transaction;
import com.fraud.entity.UserBaseline;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticalScorerService {
    
    public StatisticalScoreResult computeScore(Transaction transaction, UserBaseline baseline) {
        if (baseline.getTransactionCount() == 0 || 
            baseline.getStdAmount().compareTo(BigDecimal.ZERO) == 0) {
            return new StatisticalScoreResult(0.0, 0.0);
        }
        
        // Compute z-score
        BigDecimal zScore = transaction.getAmount()
            .subtract(baseline.getAvgAmount())
            .divide(baseline.getStdAmount(), 10, RoundingMode.HALF_UP);
        
        double zScoreValue = Math.abs(zScore.doubleValue());
        
        // Convert z-score to risk score (0-100) using sigmoid-like transformation
        double statisticalScore = 50.0 + (50.0 * (1 - Math.exp(-zScoreValue / 2.0)));
        statisticalScore = Math.min(100.0, Math.max(0.0, statisticalScore));
        
        return new StatisticalScoreResult(statisticalScore, zScore.doubleValue());
    }
    
    public static class StatisticalScoreResult {
        public final double statisticalScore;
        public final double zScore;
        
        public StatisticalScoreResult(double statisticalScore, double zScore) {
            this.statisticalScore = statisticalScore;
            this.zScore = zScore;
        }
    }
}
