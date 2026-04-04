package com.university.clinical_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ExaminationRequestDTO {
    private Long patientId;
    private Long doctorId;
    private LocalDateTime examinationDate;
    private String diagnosisCode;
    private String prescribedTreatment;
    private String medicalNotes;
}