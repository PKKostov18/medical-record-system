package com.university.clinical_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "sick_leaves")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SickLeave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id", nullable = false)
    private Examination examination;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private int durationDays;

    @Column(nullable = false)
    private LocalDate endDate;
}