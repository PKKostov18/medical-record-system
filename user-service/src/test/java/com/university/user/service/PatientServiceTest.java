package com.university.user.service;

import com.university.user.dto.PatientDTO;
import com.university.user.entity.Patient;
import com.university.user.exception.ResourceNotFoundException;
import com.university.user.repository.DoctorRepository;
import com.university.user.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private KeycloakService keycloakService;

    @InjectMocks
    private PatientService patientService;

    private PatientDTO patientDTO;
    private Patient patient;

    @BeforeEach
    void setUp() {
        patientDTO = new PatientDTO();
        patientDTO.setName("Ivan Ivanov");
        patientDTO.setEgn("1234567890");
        patientDTO.setUsername("ivan_test");
        patientDTO.setEmail("ivan@test.com");
        patientDTO.setPassword("password123");

        patient = new Patient();
        patient.setId(1L);
        patient.setName("Ivan Ivanov");
        patient.setEgn("1234567890");
        patient.setHealthInsured(true);
    }

    @Test
    void createPatient_ShouldThrowException_WhenEgnAlreadyExists() {
        // Arrange
        when(patientRepository.findByEgn(patientDTO.getEgn())).thenReturn(Optional.of(patient));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            patientService.createPatient(patientDTO);
        });

        assertEquals("A patient with this EGN already exists!", exception.getMessage());

        verify(patientRepository, never()).save(any(Patient.class));
    }

    @Test
    void createPatient_ShouldSaveAndReturnPatient_WhenDataIsValid() {
        // Arrange
        when(patientRepository.findByEgn(anyString())).thenReturn(Optional.empty());
        when(keycloakService.registerUserInKeycloak(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn("mocked-keycloak-id-123");
        when(patientRepository.save(any(Patient.class))).thenReturn(patient);

        // Act
        PatientDTO result = patientService.createPatient(patientDTO);

        // Assert
        assertNotNull(result);
        assertEquals("Ivan Ivanov", result.getName());
        assertEquals("1234567890", result.getEgn());

        verify(patientRepository, times(1)).save(any(Patient.class));
    }

    @Test
    void getPatientById_ShouldReturnPatientDTO_WhenPatientExists() {
        // Arrange
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));

        // Act
        PatientDTO result = patientService.getPatientById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Ivan Ivanov", result.getName());
    }

    @Test
    void getPatientById_ShouldThrowResourceNotFoundException_WhenPatientDoesNotExist() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            patientService.getPatientById(99L);
        });
    }
}