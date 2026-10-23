package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.ArticuloBlog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticuloBlogRepository extends JpaRepository<ArticuloBlog, Long> {
    List<ArticuloBlog> findAllByOrderByFechaCreacionDesc();
}
