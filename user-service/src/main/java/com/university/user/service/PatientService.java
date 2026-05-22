package com.university.user.service;

import com.university.user.dto.PatientDTO;
import com.university.user.entity.Doctor;
import com.university.user.entity.Patient;
import com.university.user.exception.ResourceNotFoundException;
import com.university.user.repository.DoctorRepository;
import com.university.user.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final KeycloakService keycloakService;

    @Transactional
    public PatientDTO createPatient(PatientDTO dto) {
        if (patientRepository.findByEgn(dto.getEgn()).isPresent()) {
            throw new RuntimeException("A patient with this EGN already exists!");
        }

        String keycloakId = keycloakService.registerUserInKeycloak(
                dto.getUsername(),
                dto.getEmail(),
                dto.getName(),
                dto.getPassword(),
                "ROLE_PATIENT"
        );

        Patient patient = new Patient();
        patient.setName(dto.getName());
        patient.setEgn(dto.getEgn());
        patient.setHealthInsured(dto.isHealthInsured());
        patient.setKeycloakId(keycloakId);

        if (dto.getPersonalDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(dto.getPersonalDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("General Practitioner not found!"));

            if (!doctor.isGp()) {
                throw new RuntimeException("This doctor does not have the rights of a general practitioner (GP)!");
            }
            patient.setPersonalDoctor(doctor);
        }

        Patient savedPatient = patientRepository.save(patient);
        return mapToDTO(savedPatient);
    }

    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private PatientDTO mapToDTO(Patient patient) {
        PatientDTO dto = new PatientDTO();
        dto.setId(patient.getId());
        dto.setName(patient.getName());
        dto.setEgn(patient.getEgn());
        dto.setHealthInsured(patient.isHealthInsured());

        if (patient.getPersonalDoctor() != null) {
            dto.setPersonalDoctorId(patient.getPersonalDoctor().getId());
            dto.setPersonalDoctorName(patient.getPersonalDoctor().getName());
        }
        return dto;
    }
}