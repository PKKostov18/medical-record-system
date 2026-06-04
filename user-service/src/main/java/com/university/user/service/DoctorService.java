package com.university.user.service;

import com.university.user.dto.DoctorDTO;
import com.university.user.entity.Doctor;
import com.university.user.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final KeycloakService keycloakService;

    @Transactional
    public DoctorDTO createDoctor(DoctorDTO dto) {
        if (doctorRepository.findByUin(dto.getUin()).isPresent()) {
            throw new RuntimeException("A doctor with this UIN already exists!");
        }

        String keycloakId = keycloakService.registerUserInKeycloak(
                dto.getUsername(),
                dto.getEmail(),
                dto.getName(),
                dto.getPassword(),
                "ROLE_DOCTOR"
        );

        Doctor doctor = new Doctor();
        doctor.setUin(dto.getUin());
        doctor.setName(dto.getName());
        doctor.setSpecialty(dto.getSpecialty());
        doctor.setGp(dto.isGp());
        doctor.setKeycloakId(keycloakId);

        Doctor savedDoctor = doctorRepository.save(doctor);
        return mapToDTO(savedDoctor);
    }

    public List<DoctorDTO> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public DoctorDTO mapToDTO(Doctor doctor) {
        DoctorDTO dto = new DoctorDTO();
        dto.setId(doctor.getId());
        dto.setUin(doctor.getUin());
        dto.setName(doctor.getName());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setGp(doctor.isGp());
        return dto;
    }

    public DoctorDTO getDoctorById(Long id) {
        com.university.user.entity.Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new com.university.user.exception.ResourceNotFoundException("Doctor not found with id: " + id));

        DoctorDTO dto = new DoctorDTO();
        dto.setId(doctor.getId());
        dto.setName(doctor.getName());
        dto.setUin(doctor.getUin());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setGp(doctor.isGp());

        return dto;
    }

    public DoctorDTO getDoctorByKeycloakId(String keycloakId) {
        com.university.user.entity.Doctor doctor = doctorRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new com.university.user.exception.ResourceNotFoundException("Doctor profile not linked to this account!"));

        DoctorDTO dto = new DoctorDTO();
        dto.setId(doctor.getId());
        dto.setName(doctor.getName());
        dto.setUin(doctor.getUin());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setGp(doctor.isGp());
        return dto;
    }
}