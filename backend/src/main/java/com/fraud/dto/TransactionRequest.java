package com.fraud.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequest {
    @NotBlank(message = "Transaction ID is required")
    private String transactionId;
    
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;
    
    @NotBlank(message = "Merchant ID is required")
    private String merchantId;
    
    @NotBlank(message = "Merchant category is required")
    private String merchantCategory;
    
    @NotNull(message = "Timestamp is required")
    private LocalDateTime timestamp;
    
    @NotBlank(message = "Device ID is required")
    private String deviceId;
    
    @NotBlank(message = "Location state is required")
    private String locationState;
    
    @NotBlank(message = "Location country is required")
    private String locationCountry;
    
    private String channel;
    
    private Boolean isFraud; // For evaluation purposes
}
