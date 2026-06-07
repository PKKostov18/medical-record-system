package com.university.clinical_service.controller;

import com.university.clinical_service.dto.ExaminationRequestDTO;
import com.university.clinical_service.dto.ExaminationResponseDTO;
import com.university.clinical_service.dto.PatientDTO;
import com.university.clinical_service.entity.Diagnosis;
import com.university.clinical_service.service.ExaminationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/examinations")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService examinationService;

    // --- STANDARD OPERATIONS ---

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ExaminationResponseDTO> createExamination(@RequestBody ExaminationRequestDTO requestDTO) {
        return new ResponseEntity<>(examinationService.createExamination(requestDTO), HttpStatus.CREATED);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<ExaminationResponseDTO>> getExaminationsByPatientId(
            @PathVariable Long patientId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(examinationService.getExaminationsByPatientId(patientId));
    }

    // --- STATISTICS & REPORTS (ADMIN ONLY) ---

    @GetMapping("/stats/patients-by-diagnosis/{diagnosisCode}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PatientDTO>> getPatientsByDiagnosis(@PathVariable String diagnosisCode) {
        return ResponseEntity.ok(examinationService.getPatientsByDiagnosis(diagnosisCode));
    }

    @GetMapping("/stats/most-common-diagnosis")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Diagnosis> getMostCommonDiagnosis() {
        return ResponseEntity.ok(examinationService.getMostCommonDiagnosis());
    }

    @GetMapping("/stats/revenue/total")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Double> getTotalRevenueFromPatients() {
        return ResponseEntity.ok(examinationService.getTotalRevenueFromPatients());
    }

    @GetMapping("/stats/revenue/per-doctor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Double>> getRevenuePerDoctor() {
        return ResponseEntity.ok(examinationService.getRevenuePerDoctor());
    }

    @GetMapping("/stats/visits/per-doctor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getVisitsPerDoctor() {
        return ResponseEntity.ok(examinationService.getExaminationsCountPerDoctor());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ExaminationResponseDTO>> getAllExaminationsInSystem() {
        return ResponseEntity.ok(examinationService.getAllExaminations());

    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<ExaminationResponseDTO>> getExaminationsByDoctorId(@PathVariable Long doctorId) {
        return ResponseEntity.ok(examinationService.getExaminationsByDoctorId(doctorId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ExaminationResponseDTO> updateExamination(@PathVariable Long id, @RequestBody ExaminationRequestDTO dto) {
        return ResponseEntity.ok(examinationService.updateExamination(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> deleteExamination(@PathVariable Long id) {
        examinationService.deleteExamination(id);
        return ResponseEntity.noContent().build();
    }
}