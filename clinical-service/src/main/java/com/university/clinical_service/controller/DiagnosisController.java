package com.university.clinical_service.controller;

import com.university.clinical_service.entity.Diagnosis;
import com.university.clinical_service.service.DiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diagnoses")
@RequiredArgsConstructor
public class DiagnosisController {

    private final DiagnosisService diagnosisService;

    @GetMapping
    public ResponseEntity<List<Diagnosis>> getAllDiagnoses() {
        return ResponseEntity.ok(diagnosisService.getAllDiagnoses());
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Diagnosis> createDiagnosis(@RequestBody Diagnosis diagnosis) {
        return ResponseEntity.ok(diagnosisService.createDiagnosis(diagnosis));
    }

    @PutMapping("/{code}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Diagnosis> updateDiagnosis(@PathVariable String code, @RequestBody Diagnosis diagnosis) {
        return ResponseEntity.ok(diagnosisService.updateDiagnosis(code, diagnosis));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> deleteDiagnosis(@PathVariable String code) {
        diagnosisService.deleteDiagnosis(code);
        return ResponseEntity.noContent().build();
    }
}