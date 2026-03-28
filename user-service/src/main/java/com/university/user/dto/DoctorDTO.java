package com.university.user.dto;

import lombok.Data;

@Data
public class DoctorDTO {
    private Long id;
    private String uin;
    private String name;
    private String specialty;
    private boolean isGp; // Може ли да е личен лекар
}