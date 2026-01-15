package com.fraud.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "fraud.detection")
@Data
public class FraudDetectionConfig {
    private Scoring scoring = new Scoring();
    private Thresholds thresholds = new Thresholds();
    private Rules rules = new Rules();
    private ML ml = new ML();
    
    @Data
    public static class Scoring {
        private Double ruleWeight = 0.5;
        private Double statisticalWeight = 0.3;
        private Double mlWeight = 0.2;
    }
    
    @Data
    public static class Thresholds {
        private Double softFlag = 50.0;
        private Double hardFlag = 80.0;
    }
    
    @Data
    public static class Rules {
        private Integer velocityThreshold = 3;
        private Integer velocityWindowMinutes = 5;
        private Double amountAnomalyStdDev = 3.0;
        private Integer geographicTimeWindowHours = 2;
    }
    
    @Data
    public static class ML {
        private String serviceUrl = "http://localhost:8000";
        private Integer timeoutSeconds = 5;
    }
}
