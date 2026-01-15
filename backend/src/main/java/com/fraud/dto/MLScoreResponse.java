package com.fraud.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MLScoreResponse {
    private Double mlScore; // 0-1
    private String modelVersion;
    private List<String> contributingReasons; // Optional
}
