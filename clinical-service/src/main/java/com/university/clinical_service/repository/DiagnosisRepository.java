package com.university.clinical_service.repository;

import com.university.clinical_service.entity.Diagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiagnosisRepository extends JpaRepository<Diagnosis, Long> {
    Optional<Diagnosis> findByCode(String code);
}