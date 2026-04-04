package com.university.clinical_service.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SickLeaveResponseDTO {
    private Long id;
    private Long examinationId;
    private LocalDate startDate;
    private int durationDays;
    private LocalDate endDate;
}