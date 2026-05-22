package com.university.user.dto;

import lombok.Data;

@Data
public class DoctorDTO {
    private Long id;
    private String uin;
    private String name;
    private String specialty;
    private boolean isGp;

    private String username;
    private String email;
    private String password;
}