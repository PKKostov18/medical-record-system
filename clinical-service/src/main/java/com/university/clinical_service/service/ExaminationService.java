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
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.awt.print.Pageable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

        boolean paidByNzok = patient.isHealthInsured();

        Diagnosis diagnosis = diagnosisRepository.findByCode(requestDTO.getDiagnosisCode())
                .orElseThrow(() -> new RuntimeException("Diagnosis code not found: " + requestDTO.getDiagnosisCode()));

        Examination examination = Examination.builder()
                .patientId(patient.getId())
                .doctorId(doctor.getId())
                .examinationDate(requestDTO.getExaminationDate())
                .diagnosis(diagnosis)
                .prescribedTreatment(requestDTO.getPrescribedTreatment())
                .medicalNotes(requestDTO.getMedicalNotes())
                // If paid by NZOK, the price to the patient is practically 0. Otherwise, it's the requested price.
                .price(paidByNzok ? 0.0 : requestDTO.getPrice())
                .isPaidByNzok(paidByNzok)
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

    // --- NEW STATISTICS METHODS ---

    /**
     * 1. List of patients with a given diagnosis.
     */
    public List<PatientDTO> getPatientsByDiagnosis(String diagnosisCode) {
        List<Long> patientIds = examinationRepository.findPatientIdsByDiagnosisCode(diagnosisCode);

        // Fetch the full patient details from user-service for each ID
        return patientIds.stream()
                .map(userServiceClient::getPatientById)
                .collect(Collectors.toList());
    }

    /**
     * 2. Most common diagnosis.
     */
    public Diagnosis getMostCommonDiagnosis() {
        // PageRequest.of(0, 1) safely limits the result to the top 1 diagnosis
        List<Diagnosis> diagnoses = examinationRepository.findMostCommonDiagnoses((Pageable) PageRequest.of(0, 1));
        if (diagnoses.isEmpty()) {
            throw new RuntimeException("No diagnoses found in the system.");
        }
        return diagnoses.getFirst();
    }

    /**
     * 3. Total value of the examinations paid by the patients.
     */
    public Double getTotalRevenueFromPatients() {
        Double total = examinationRepository.calculateTotalRevenueFromPatients();
        return total != null ? total : 0.0; // Prevent null pointer if there are no paid exams
    }

    /**
     * 4. Value of the examinations paid by the patients, grouped by doctor.
     */
    public Map<String, Double> getRevenuePerDoctor() {
        List<Object[]> results = examinationRepository.calculateRevenuePerDoctor();
        Map<String, Double> revenuePerDoctor = new HashMap<>();

        for (Object[] row : results) {
            Long doctorId = (Long) row[0];
            Double revenue = (Double) row[1];

            // Fetch the actual doctor's name to make the API response readable
            DoctorDTO doctor = userServiceClient.getDoctorById(doctorId);
            revenuePerDoctor.put("Dr. " + doctor.getName(), revenue);
        }

        return revenuePerDoctor;
    }

    /**
     * 5. Number of visits per doctor.
     */
    public Map<String, Long> getExaminationsCountPerDoctor() {
        List<Object[]> results = examinationRepository.countExaminationsPerDoctor();
        Map<String, Long> visitsPerDoctor = new HashMap<>();

        for (Object[] row : results) {
            Long doctorId = (Long) row[0];
            Long count = (Long) row[1];

            DoctorDTO doctor = userServiceClient.getDoctorById(doctorId);
            visitsPerDoctor.put("Dr. " + doctor.getName(), count);
        }

        return visitsPerDoctor;
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
        response.setPrice(exam.getPrice());
        response.setPaidByNzok(exam.isPaidByNzok());
        return response;
    }
}