package com.university.clinical_service.service;

import com.university.clinical_service.entity.Diagnosis;
import com.university.clinical_service.repository.DiagnosisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiagnosisService {

    private final DiagnosisRepository diagnosisRepository;

    public List<Diagnosis> getAllDiagnoses() {
        return diagnosisRepository.findAll();
    }

    @Transactional
    public Diagnosis createDiagnosis(Diagnosis diagnosis) {
        if (diagnosisRepository.findByCode(diagnosis.getCode()).isPresent()) {
            throw new RuntimeException("A diagnosis with this ICD code already exists!");
        }
        return diagnosisRepository.save(diagnosis);
    }

    @Transactional
    public Diagnosis updateDiagnosis(String code, Diagnosis dto) {
        Diagnosis diagnosis = diagnosisRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Diagnosis not found!"));

        diagnosis.setName(dto.getName());
        if (dto.getDescription() != null) {
            diagnosis.setDescription(dto.getDescription());
        }

        return diagnosisRepository.save(diagnosis);
    }

    @Transactional
    public void deleteDiagnosis(String code) {
        Diagnosis diagnosis = diagnosisRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Diagnosis not found!"));

        diagnosisRepository.delete(diagnosis);
    }
}