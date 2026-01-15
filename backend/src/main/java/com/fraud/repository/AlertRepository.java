package com.fraud.repository;

import com.fraud.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByStatusOrderByCreatedAtDesc(Alert.AlertStatus status);
    boolean existsByTransactionId(String transactionId);
}
