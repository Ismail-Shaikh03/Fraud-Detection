package com.fraud.controller;

import com.fraud.entity.Alert;
import com.fraud.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {
    
    private final AlertRepository alertRepository;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAlerts(
            @RequestParam(required = false) Alert.AlertStatus status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "15") int size) {
        
        Page<Alert> alertPage;
        
        if (status != null) {
            alertPage = alertRepository.findByStatusOrderByCreatedAtDesc(
                status, 
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
            );
        } else {
            alertPage = alertRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
            );
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("content", alertPage.getContent());
        result.put("page", alertPage.getNumber());
        result.put("size", alertPage.getSize());
        result.put("totalElements", alertPage.getTotalElements());
        result.put("totalPages", alertPage.getTotalPages());
        result.put("hasNext", alertPage.hasNext());
        result.put("hasPrevious", alertPage.hasPrevious());
        
        return ResponseEntity.ok(result);
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
