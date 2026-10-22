package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.CategoriaBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaBadgeRepository extends JpaRepository<CategoriaBadge, String> {
}
