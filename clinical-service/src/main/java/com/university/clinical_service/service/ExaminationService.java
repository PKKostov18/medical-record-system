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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExaminationService {

    private final ExaminationRepository examinationRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final UserServiceClient userServiceClient;

    public ExaminationResponseDTO createExamination(ExaminationRequestDTO requestDTO) {
        PatientDTO patient = userServiceClient.getPatientById(requestDTO.getPatientId());
        DoctorDTO doctor = userServiceClient.getDoctorById(requestDTO.getDoctorId());

        if (!patient.isHealthInsured()) {
            throw new RuntimeException("Patient does not have valid health insurance.");
        }

        Diagnosis diagnosis = diagnosisRepository.findByCode(requestDTO.getDiagnosisCode())
                .orElseThrow(() -> new RuntimeException("Diagnosis code not found: " + requestDTO.getDiagnosisCode()));

        Examination examination = Examination.builder()
                .patientId(patient.getId())
                .doctorId(doctor.getId())
                .examinationDate(requestDTO.getExaminationDate())
                .diagnosis(diagnosis)
                .prescribedTreatment(requestDTO.getPrescribedTreatment())
                .medicalNotes(requestDTO.getMedicalNotes())
                .build();

        Examination savedExamination = examinationRepository.save(examination);

        return mapToResponseDTO(savedExamination, patient, doctor);
    }

    public List<ExaminationResponseDTO> getExaminationsByPatientId(Long patientId) {
        PatientDTO patient = userServiceClient.getPatientById(patientId);

        return examinationRepository.findByPatientId(patientId).stream()
                .map(exam -> {
                    DoctorDTO doctor = userServiceClient.getDoctorById(exam.getDoctorId());
                    return mapToResponseDTO(exam, patient, doctor);
                })
                .collect(Collectors.toList());
    }

    private ExaminationResponseDTO mapToResponseDTO(Examination exam, PatientDTO patient, DoctorDTO doctor) {
        ExaminationResponseDTO response = new ExaminationResponseDTO();
        response.setId(exam.getId());
        response.setPatient(patient);
        response.setDoctor(doctor);
        response.setExaminationDate(exam.getExaminationDate());
        response.setDiagnosisName(exam.getDiagnosis().getName());
        response.setPrescribedTreatment(exam.getPrescribedTreatment());
        response.setMedicalNotes(exam.getMedicalNotes());
        return response;
    }
}