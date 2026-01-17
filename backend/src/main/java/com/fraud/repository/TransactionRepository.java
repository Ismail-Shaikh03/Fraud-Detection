package com.fraud.repository;

import com.fraud.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByUserIdOrderByTimestampDesc(String userId);
    
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.timestamp >= :since ORDER BY t.timestamp DESC")
    List<Transaction> findRecentTransactionsByUser(
        @Param("userId") String userId,
        @Param("since") LocalDateTime since
    );
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.userId = :userId " +
           "AND t.timestamp >= :since")
    Long countRecentTransactions(
        @Param("userId") String userId,
        @Param("since") LocalDateTime since
    );
    
    Page<Transaction> findByRiskCategoryOrderByTimestampDesc(
        String riskCategory, 
        Pageable pageable
    );
}
