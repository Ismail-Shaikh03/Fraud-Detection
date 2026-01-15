package com.fraud.controller;

import com.fraud.entity.Alert;
import com.fraud.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {
    
    private final AlertRepository alertRepository;
    
    @GetMapping
    public ResponseEntity<List<Alert>> getAlerts(
            @RequestParam(required = false) Alert.AlertStatus status) {
        List<Alert> alerts = status != null 
            ? alertRepository.findByStatusOrderByCreatedAtDesc(status)
            : alertRepository.findAll();
        return ResponseEntity.ok(alerts);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Alert> updateAlertStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        return alertRepository.findById(id)
            .map(alert -> {
                String statusStr = request.get("status");
                if (statusStr != null) {
                    try {
                        alert.setStatus(Alert.AlertStatus.valueOf(statusStr));
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Invalid status: " + statusStr);
                    }
                }
                String notes = request.get("analystNotes");
                if (notes != null) {
                    alert.setAnalystNotes(notes);
                }
                Alert saved = alertRepository.save(alert);
                return ResponseEntity.ok(saved);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
