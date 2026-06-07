package com.university.clinical_service.service;

import com.university.clinical_service.dto.SickLeaveRequestDTO;
import com.university.clinical_service.dto.SickLeaveResponseDTO;
import com.university.clinical_service.entity.Examination;
import com.university.clinical_service.entity.SickLeave;
import com.university.clinical_service.repository.ExaminationRepository;
import com.university.clinical_service.repository.SickLeaveRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SickLeaveServiceTest {

    @Mock
    private SickLeaveRepository sickLeaveRepository;

    @Mock
    private ExaminationRepository examinationRepository;

    @InjectMocks
    private SickLeaveService sickLeaveService;

    @Test
    void issueSickLeave_ShouldSaveSuccessfully() {
        // Arrange
        SickLeaveRequestDTO req = new SickLeaveRequestDTO();
        req.setExaminationId(1L);
        req.setStartDate(LocalDate.now());
        req.setDurationDays(5);

        Examination exam = new Examination();
        exam.setId(1L);

        SickLeave savedLeave = new SickLeave();
        savedLeave.setId(10L);
        savedLeave.setDurationDays(5);
        savedLeave.setExamination(exam);

        when(examinationRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(sickLeaveRepository.save(any(SickLeave.class))).thenReturn(savedLeave);

        // Act
        SickLeaveResponseDTO result = sickLeaveService.issueSickLeave(req);

        // Assert
        assertNotNull(result);
        assertEquals(10L, result.getId());
        verify(sickLeaveRepository, times(1)).save(any(SickLeave.class));
    }
}