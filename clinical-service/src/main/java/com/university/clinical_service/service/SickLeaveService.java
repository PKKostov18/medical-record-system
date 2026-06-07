package com.university.clinical_service.service;

import com.university.clinical_service.dto.SickLeaveRequestDTO;
import com.university.clinical_service.dto.SickLeaveResponseDTO;
import com.university.clinical_service.entity.Examination;
import com.university.clinical_service.entity.SickLeave;
import com.university.clinical_service.repository.ExaminationRepository;
import com.university.clinical_service.repository.SickLeaveRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SickLeaveService {

    private final SickLeaveRepository sickLeaveRepository;
    private final ExaminationRepository examinationRepository;

    public SickLeaveResponseDTO issueSickLeave(SickLeaveRequestDTO requestDTO) {
        Examination examination = examinationRepository.findById(requestDTO.getExaminationId())
                .orElseThrow(() -> new RuntimeException("Examination not found with ID: " + requestDTO.getExaminationId()));

        LocalDate endDate = requestDTO.getStartDate().plusDays(requestDTO.getDurationDays());

        SickLeave sickLeave = SickLeave.builder()
                .examination(examination)
                .startDate(requestDTO.getStartDate())
                .durationDays(requestDTO.getDurationDays())
                .endDate(endDate)
                .build();

        SickLeave savedSickLeave = sickLeaveRepository.save(sickLeave);

        return mapToResponseDTO(savedSickLeave);
    }

    @Transactional
    public SickLeave updateSickLeave(Long id, SickLeaveRequestDTO dto) {
        SickLeave sickLeave = sickLeaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sick leave not found!"));

        sickLeave.setStartDate(dto.getStartDate());
        sickLeave.setDurationDays(dto.getDurationDays());
        sickLeave.setEndDate(dto.getStartDate().plusDays(dto.getDurationDays()));

        return sickLeaveRepository.save(sickLeave);
    }

    @Transactional
    public void deleteSickLeave(Long id) {
        sickLeaveRepository.deleteById(id);
    }

    private SickLeaveResponseDTO mapToResponseDTO(SickLeave sickLeave) {
        SickLeaveResponseDTO response = new SickLeaveResponseDTO();
        response.setId(sickLeave.getId());
        response.setExaminationId(sickLeave.getExamination().getId());
        response.setStartDate(sickLeave.getStartDate());
        response.setDurationDays(sickLeave.getDurationDays());
        response.setEndDate(sickLeave.getEndDate());
        return response;
    }
}