package com.university.clinical_service.controller;

import com.university.clinical_service.dto.SickLeaveRequestDTO;
import com.university.clinical_service.dto.SickLeaveResponseDTO;
import com.university.clinical_service.service.SickLeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sick-leaves")
@RequiredArgsConstructor
public class SickLeaveController {

    private final SickLeaveService sickLeaveService;

    @PostMapping
    public ResponseEntity<SickLeaveResponseDTO> issueSickLeave(@RequestBody SickLeaveRequestDTO requestDTO) {
        return new ResponseEntity<>(sickLeaveService.issueSickLeave(requestDTO), HttpStatus.CREATED);
    }
}