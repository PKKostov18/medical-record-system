package com.university.clinical_service.controller;

import com.university.clinical_service.dto.SickLeaveRequestDTO;
import com.university.clinical_service.dto.SickLeaveResponseDTO;
import com.university.clinical_service.entity.SickLeave;
import com.university.clinical_service.service.SickLeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sick-leaves")
@RequiredArgsConstructor
public class SickLeaveController {

    private final SickLeaveService sickLeaveService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<SickLeaveResponseDTO> issueSickLeave(@RequestBody SickLeaveRequestDTO requestDTO) {
        return new ResponseEntity<>(sickLeaveService.issueSickLeave(requestDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<SickLeave> updateSickLeave(@PathVariable Long id, @RequestBody SickLeaveRequestDTO dto) {
        return ResponseEntity.ok(sickLeaveService.updateSickLeave(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> deleteSickLeave(@PathVariable Long id) {
        sickLeaveService.deleteSickLeave(id);
        return ResponseEntity.noContent().build();
    }
}