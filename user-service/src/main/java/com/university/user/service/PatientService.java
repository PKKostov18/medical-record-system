package com.university.user.service;

import com.university.user.dto.PatientDTO;
import com.university.user.entity.Doctor;
import com.university.user.entity.Patient;
import com.university.user.exception.ResourceNotFoundException;
import com.university.user.repository.DoctorRepository;
import com.university.user.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public PatientDTO createPatient(PatientDTO dto) {
        if (patientRepository.findByEgn(dto.getEgn()).isPresent()) {
            throw new RuntimeException("Пациент с това ЕГН вече съществува!");
        }

        Patient patient = new Patient();
        patient.setName(dto.getName());
        patient.setEgn(dto.getEgn());
        patient.setHealthInsured(dto.isHealthInsured());

        if (dto.getPersonalDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(dto.getPersonalDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Личният лекар не е намерен!"));

            if (!doctor.isGp()) {
                throw new RuntimeException("Този лекар няма права на личен лекар (GP)!");
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