package com.university.user.service;

import com.university.user.dto.DoctorDTO;
import com.university.user.entity.Doctor;
import com.university.user.exception.ResourceNotFoundException;
import com.university.user.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorDTO createDoctor(DoctorDTO dto) {
        if (doctorRepository.findByUin(dto.getUin()).isPresent()) {
            throw new RuntimeException("A doctor with this UIN already exists!");
        }

        Doctor doctor = new Doctor();
        doctor.setUin(dto.getUin());
        doctor.setName(dto.getName());
        doctor.setSpecialty(dto.getSpecialty());
        doctor.setGp(dto.isGp());

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
}