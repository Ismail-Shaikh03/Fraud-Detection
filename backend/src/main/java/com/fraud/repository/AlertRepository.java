package com.fraud.repository;

import com.fraud.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByStatusOrderByCreatedAtDesc(Alert.AlertStatus status);
    Page<Alert> findByStatusOrderByCreatedAtDesc(Alert.AlertStatus status, Pageable pageable);
    Page<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);
    boolean existsByTransactionId(String transactionId);
}
