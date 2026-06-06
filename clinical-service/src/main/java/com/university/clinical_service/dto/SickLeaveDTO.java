package com.university.clinical_service.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SickLeaveDTO {
    private LocalDate startDate;
    private Integer durationDays;
}