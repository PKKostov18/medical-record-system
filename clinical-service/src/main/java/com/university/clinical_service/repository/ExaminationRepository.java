package com.university.clinical_service.repository;

import com.university.clinical_service.entity.Examination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExaminationRepository extends JpaRepository<Examination, Long> {
    List<Examination> findByPatientId(Long patientId);
    List<Examination> findByDoctorId(Long doctorId);
    List<Examination> findByExaminationDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}