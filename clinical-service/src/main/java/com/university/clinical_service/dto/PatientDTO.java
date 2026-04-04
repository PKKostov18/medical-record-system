package com.university.clinical_service.dto;

import lombok.Data;

@Data
public class PatientDTO {
    private Long id;
    private String name;
    private String egn;
    private boolean healthInsured;
    private Long personalDoctorId;
    private String personalDoctorName;
}