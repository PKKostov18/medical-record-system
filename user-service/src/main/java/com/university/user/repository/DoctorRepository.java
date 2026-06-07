package com.university.user.repository;

import com.university.user.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUin(String uin);
    Optional<Doctor> findByKeycloakId(String keycloakId);
}