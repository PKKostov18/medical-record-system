package com.university.clinical_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ExaminationResponseDTO {
    private Long id;
    private PatientDTO patient;
    private DoctorDTO doctor;
    private LocalDateTime examinationDate;
    private String diagnosisName;
    private String prescribedTreatment;
    private String medicalNotes;
    private Double price;
    private boolean isPaidByNzok;
}