package com.university.user.dto;

import lombok.Data;

@Data
public class PatientDTO {
    private Long id;
    private String name;
    private String egn;
    private boolean isHealthInsured;

    private Long personalDoctorId;
    private String personalDoctorName;

    private String username;
    private String email;
    private String password;
}