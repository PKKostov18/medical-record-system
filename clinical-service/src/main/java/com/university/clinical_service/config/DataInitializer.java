package com.university.clinical_service.config;

import com.university.clinical_service.entity.Diagnosis;
import com.university.clinical_service.repository.DiagnosisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DiagnosisRepository diagnosisRepository;

    @Override
    public void run(String... args) throws Exception {
        if (diagnosisRepository.count() == 0) {
            System.out.println("--- DB is empty. Initializing default diagnoses... ---");

            Diagnosis d1 = new Diagnosis();
            d1.setCode("J00");
            d1.setName("Acute nasopharyngitis");
            d1.setDescription("Acute cold, inflammation of the upper respiratory tract");

            Diagnosis d2 = new Diagnosis();
            d2.setCode("I10");
            d2.setName("Essential (primary) hypertension");
            d2.setDescription("High blood pressure without a known secondary cause");

            Diagnosis d3 = new Diagnosis();
            d3.setCode("E11");
            d3.setName("Type 2 diabetes mellitus");
            d3.setDescription("Type 2 diabetes characterized by insulin resistance");

            Diagnosis d4 = new Diagnosis();
            d4.setCode("J20.9");
            d4.setName("Acute bronchitis, unspecified");
            d4.setDescription("Acute inflammation of the bronchi");

            Diagnosis d5 = new Diagnosis();
            d5.setCode("K21.9");
            d5.setName("Gastro-esophageal reflux disease");
            d5.setDescription("GERD - Gastroesophageal reflux disease without esophagitis");

            diagnosisRepository.saveAll(List.of(d1, d2, d3, d4, d5));

            System.out.println("--- Default diagnoses successfully saved! ---");
        }
    }
}