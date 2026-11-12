package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.AjustesWeb;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AjustesWebRepository extends JpaRepository<AjustesWeb, Long> {
}
