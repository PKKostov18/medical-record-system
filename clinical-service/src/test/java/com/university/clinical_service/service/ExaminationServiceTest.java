package com.university.clinical_service.service;

import com.university.clinical_service.dto.ExaminationResponseDTO;
import com.university.clinical_service.entity.Examination;
import com.university.clinical_service.repository.ExaminationRepository;
import com.university.clinical_service.client.UserServiceClient; // Твоят Feign клиент
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExaminationServiceTest {

    @Mock
    private ExaminationRepository examinationRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private ExaminationService examinationService;

    @Test
    void getExaminationsByDoctorId_ShouldReturnList() {
        // Arrange
        Examination exam = new Examination();
        exam.setId(1L);
        exam.setDoctorId(10L);
        exam.setPatientId(20L);

        when(examinationRepository.findByDoctorId(10L)).thenReturn(List.of(exam));


        // Act
        List<ExaminationResponseDTO> result = examinationService.getExaminationsByDoctorId(10L);

        // Assert
        assertNotNull(result);
        verify(examinationRepository, times(1)).findByDoctorId(10L);
    }
}