package com.university.clinical_service.controller;

import com.university.clinical_service.dto.ExaminationRequestDTO;
import com.university.clinical_service.dto.ExaminationResponseDTO;
import com.university.clinical_service.service.ExaminationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/examinations")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService examinationService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ExaminationResponseDTO> createExamination(@RequestBody ExaminationRequestDTO requestDTO) {
        return new ResponseEntity<>(examinationService.createExamination(requestDTO), HttpStatus.CREATED);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR') or #patientId.toString() == #jwt.subject")
    public ResponseEntity<List<ExaminationResponseDTO>> getExaminationsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(examinationService.getExaminationsByPatientId(patientId));
    }
}