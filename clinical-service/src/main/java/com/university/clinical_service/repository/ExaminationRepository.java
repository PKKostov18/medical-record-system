package com.university.clinical_service.repository;

import com.university.clinical_service.entity.Diagnosis;
import com.university.clinical_service.entity.Examination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExaminationRepository extends JpaRepository<Examination, Long> {
    List<Examination> findByPatientId(Long patientId);
    List<Examination> findByDoctorId(Long doctorId);
    List<Examination> findByExaminationDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT DISTINCT e.patientId FROM Examination e WHERE e.diagnosis.code = :diagnosisCode")
    List<Long> findPatientIdsByDiagnosisCode(@Param("diagnosisCode") String diagnosisCode);

    @Query("SELECT e.diagnosis FROM Examination e GROUP BY e.diagnosis ORDER BY COUNT(e.id) DESC")
    List<Diagnosis> findMostCommonDiagnoses(Pageable pageable);

    @Query("SELECT SUM(e.price) FROM Examination e WHERE e.isPaidByNzok = false")
    Double calculateTotalRevenueFromPatients();

    @Query("SELECT e.doctorId, SUM(e.price) FROM Examination e WHERE e.isPaidByNzok = false GROUP BY e.doctorId")
    List<Object[]> calculateRevenuePerDoctor();

    @Query("SELECT e.doctorId, COUNT(e.id) FROM Examination e GROUP BY e.doctorId")
    List<Object[]> countExaminationsPerDoctor();

    @Modifying
    @Query("DELETE FROM Examination e WHERE e.doctorId = :doctorId")
    void deleteByDoctorId(@Param("doctorId") Long doctorId);

    boolean existsByPatientId(Long patientId);
}