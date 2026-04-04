package com.university.clinical_service.dto;

import lombok.Data;

@Data
public class DoctorDTO {
    private Long id;
    private String uin;
    private String name;
    private String specialty;
    private boolean gp;
}