package com.university.user.service;

import com.university.user.dto.DoctorDTO;
import com.university.user.entity.Doctor;
import com.university.user.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private KeycloakService keycloakService;

    @InjectMocks
    private DoctorService doctorService;

    private Doctor doctor;
    private DoctorDTO doctorDTO;

    @BeforeEach
    void setUp() {
        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setName("Petar Petrov");
        doctor.setUin("1234567890");
        doctor.setSpecialty("Cardiology");
        doctor.setGp(false);

        doctorDTO = new DoctorDTO();
        doctorDTO.setName("Petar Petrov");
        doctorDTO.setUin("1234567890");
        doctorDTO.setSpecialty("Cardiology");
        doctorDTO.setGp(false);
        doctorDTO.setUsername("dr_petrov");
        doctorDTO.setPassword("pass123");
        doctorDTO.setEmail("petrov@hospital.com");
    }

    @Test
    void createDoctor_ShouldSaveAndReturnDoctor() {
        // Arrange
        when(doctorRepository.findByUin(anyString())).thenReturn(Optional.empty());
        when(keycloakService.registerUserInKeycloak(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn("mock-keycloak-id");
        when(doctorRepository.save(any(Doctor.class))).thenReturn(doctor);

        // Act
        DoctorDTO result = doctorService.createDoctor(doctorDTO);

        // Assert
        assertNotNull(result);
        assertEquals("Petar Petrov", result.getName());
        assertEquals("1234567890", result.getUin());
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }

    @Test
    void createDoctor_ShouldThrowException_WhenUinExists() {
        // Arrange
        when(doctorRepository.findByUin(doctorDTO.getUin())).thenReturn(Optional.of(doctor));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            doctorService.createDoctor(doctorDTO);
        });
        assertTrue(exception.getMessage().contains("UIN already exists"));
        verify(doctorRepository, never()).save(any(Doctor.class));
    }

    @Test
    void getAllDoctors_ShouldReturnList() {
        // Arrange
        when(doctorRepository.findAll()).thenReturn(List.of(doctor));

        // Act
        List<DoctorDTO> result = doctorService.getAllDoctors();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Petar Petrov", result.get(0).getName());
    }
}