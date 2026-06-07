package com.university.clinical_service.service;

import com.university.clinical_service.client.UserServiceClient;
import com.university.clinical_service.dto.DoctorDTO;
import com.university.clinical_service.dto.ExaminationRequestDTO;
import com.university.clinical_service.dto.ExaminationResponseDTO;
import com.university.clinical_service.dto.PatientDTO;
import com.university.clinical_service.entity.Diagnosis;
import com.university.clinical_service.entity.Examination;
import com.university.clinical_service.repository.DiagnosisRepository;
import com.university.clinical_service.repository.ExaminationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExaminationServiceTest {

    @Mock
    private ExaminationRepository examinationRepository;

    @Mock
    private DiagnosisRepository diagnosisRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private ExaminationService examinationService;

    private Examination examination;
    private PatientDTO mockPatient;
    private DoctorDTO mockDoctor;
    private Diagnosis mockDiagnosis;

    @BeforeEach
    void setUp() {
        mockDiagnosis = new Diagnosis();
        mockDiagnosis.setCode("J03.9");
        mockDiagnosis.setName("Acute tonsillitis");

        examination = new Examination();
        examination.setId(1L);
        examination.setPatientId(100L);
        examination.setDoctorId(200L);
        examination.setDiagnosis(mockDiagnosis);
        examination.setPrice(50.00);
        examination.setPaidByNzok(false);
        examination.setExaminationDate(LocalDateTime.now());

        mockPatient = new PatientDTO();
        mockPatient.setId(100L);
        mockPatient.setName("Test Patient");

        mockDoctor = new DoctorDTO();
        mockDoctor.setId(200L);
        mockDoctor.setName("Test Doctor");
    }

    @Test
    void getExaminationsByDoctorId_ShouldReturnMappedList_EvenIfUserServiceFails() {
        // Arrange
        when(examinationRepository.findByDoctorId(200L)).thenReturn(List.of(examination));

        when(userServiceClient.getDoctorById(200L)).thenReturn(mockDoctor);
        when(userServiceClient.getPatientById(100L)).thenThrow(new RuntimeException("Service down"));

        // Act
        List<ExaminationResponseDTO> result = examinationService.getExaminationsByDoctorId(200L);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Test Doctor", result.get(0).getDoctor().getName());

        assertNull(result.get(0).getPatient().getName() != null ? result.getFirst().getPatient().getName() : null);
    }

    @Test
    void createExamination_ShouldSaveSuccessfully() {
        // Arrange
        ExaminationRequestDTO req = new ExaminationRequestDTO();
        req.setPatientId(100L);
        req.setDoctorId(200L);
        req.setDiagnosisCode("J03.9");
        req.setPrice(50.00);

        when(diagnosisRepository.findById(Long.valueOf("J03.9"))).thenReturn(Optional.of(mockDiagnosis));
        when(examinationRepository.save(any(Examination.class))).thenReturn(examination);
        when(userServiceClient.getPatientById(100L)).thenReturn(mockPatient);
        when(userServiceClient.getDoctorById(200L)).thenReturn(mockDoctor);

        // Act
        ExaminationResponseDTO result = examinationService.createExamination(req);

        // Assert
        assertNotNull(result);
        assertEquals("Acute tonsillitis", result.getDiagnosisName());
        verify(examinationRepository, times(1)).save(any(Examination.class));
    }
}