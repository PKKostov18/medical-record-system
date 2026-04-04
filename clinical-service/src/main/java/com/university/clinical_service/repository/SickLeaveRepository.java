package com.university.clinical_service.repository;

import com.university.clinical_service.entity.SickLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SickLeaveRepository extends JpaRepository<SickLeave, Long> {
    List<SickLeave> findByExaminationId(Long examinationId);
    List<SickLeave> findByStartDateBetween(LocalDate start, LocalDate end);
}