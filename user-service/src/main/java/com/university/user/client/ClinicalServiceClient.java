package com.university.user.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "clinical-service")
public interface ClinicalServiceClient {

    @DeleteMapping("/api/examinations/doctor/{doctorId}")
    void deleteExaminationsByDoctor(@PathVariable("doctorId") Long doctorId);

    @GetMapping("/api/examinations/exists-by-patient/{patientId}")
    boolean hasExaminations(@PathVariable("patientId") Long patientId);
}