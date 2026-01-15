package com.fraud.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MLScoreRequest {
    private BigDecimal amount;
    private Integer hourOfDay;
    private Integer velocity10m;
    private Double distanceFromLastKm;
    private Integer isNewDevice; // 0 or 1
    private Integer isNewMerchant; // 0 or 1
    private String merchantCategory;
}
