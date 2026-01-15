package com.fraud.repository;

import com.fraud.entity.UserBaseline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBaselineRepository extends JpaRepository<UserBaseline, String> {
}
