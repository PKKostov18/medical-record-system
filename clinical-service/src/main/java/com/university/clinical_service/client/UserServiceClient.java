package com.university.clinical_service.client;

import com.university.clinical_service.dto.DoctorDTO;
import com.university.clinical_service.dto.PatientDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "http://localhost:8081")
public interface UserServiceClient {

    @GetMapping("/api/patients/{id}")
    PatientDTO getPatientById(@PathVariable("id") Long id);

    @GetMapping("/api/doctors/{id}")
    DoctorDTO getDoctorById(@PathVariable("id") Long id);
}