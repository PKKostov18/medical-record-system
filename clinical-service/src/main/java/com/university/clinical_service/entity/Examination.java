package com.university.clinical_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "examinations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Examination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private LocalDateTime examinationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagnosis_id")
    private Diagnosis diagnosis;

    private String prescribedTreatment;

    private String medicalNotes;

    @Column(nullable = false)
    private Double price;

    @Column(name = "is_paid_by_nzok", nullable = false)
    private boolean isPaidByNzok;

    @OneToOne(mappedBy = "examination") private SickLeave sickLeave;
}