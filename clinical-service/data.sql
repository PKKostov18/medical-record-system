-- Real ICD-10 medical codes and diagnoses
INSERT INTO diagnoses (code, name, description)
VALUES ('J00', 'Acute nasopharyngitis', 'Acute cold, inflammation of the upper respiratory tract')
ON CONFLICT (code) DO NOTHING;

INSERT INTO diagnoses (code, name, description)
VALUES ('I10', 'Essential (primary) hypertension', 'High blood pressure without a known secondary cause')
ON CONFLICT (code) DO NOTHING;

INSERT INTO diagnoses (code, name, description)
VALUES ('E11', 'Type 2 diabetes mellitus', 'Type 2 diabetes characterized by insulin resistance')
ON CONFLICT (code) DO NOTHING;

INSERT INTO diagnoses (code, name, description)
VALUES ('J20.9', 'Acute bronchitis, unspecified', 'Acute inflammation of the bronchi')
ON CONFLICT (code) DO NOTHING;

INSERT INTO diagnoses (code, name, description)
VALUES ('K21.9', 'Gastro-esophageal reflux disease', 'GERD - Gastroesophageal reflux disease without esophagitis')
ON CONFLICT (code) DO NOTHING;