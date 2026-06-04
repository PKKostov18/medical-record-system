import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Badge, Nav, Tab, Alert, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface Patient {
    id: number;
    name: string;
    egn: string;
    healthInsured: boolean;
}

interface Diagnosis {
    code: string;
    name: string;
}

interface Examination {
    id: number;
    patient: Patient;
    doctor: { id: number; name: string };
    examinationDate: string;
    diagnosisName: string;
    prescribedTreatment: string;
    medicalNotes: string;
    price: number;
    paidByNzok: boolean;
    // Опционално поле: ако някога бекендът започне да връща болничния заедно с прегледа
    sickLeave?: { startDate: string, durationDays: number };
}

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const token = localStorage.getItem('token');

    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [examinations, setExaminations] = useState<Examination[]>([]);
    const [diagnosesList, setDiagnosesList] = useState<Diagnosis[]>([]);

    // Състояние за красивото падащо меню с диагнози
    const [diagnosisSearch, setDiagnosisSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Локално състояние, за да показваме издадените болнични веднага на екрана
    const [sessionSickLeaves, setSessionSickLeaves] = useState<Record<number, any>>({});

    const [currentDoctorId, setCurrentDoctorId] = useState<number | null>(null);

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [newExam, setNewExam] = useState({
        diagnosisCode: '',
        prescribedTreatment: '',
        medicalNotes: '',
        price: 0
    });

    const [sickLeaveExamId, setSickLeaveExamId] = useState<number | null>(null);
    const [sickLeaveData, setSickLeaveData] = useState({ startDate: '', durationDays: 1 });

    if (!user || !token) {
        return <Navigate to="/login" />;
    }

    const api = axios.create({
        baseURL: 'http://localhost:9000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        api.get('/patients')
            .then(res => { if (Array.isArray(res.data)) setPatients(res.data); })
            .catch(err => console.error("Error loading patients", err));

        api.get('/doctors/me')
            .then(res => { if (res.data && res.data.id) setCurrentDoctorId(res.data.id); })
            .catch(err => console.error("Your doctor profile is missing", err));

        api.get('/diagnoses')
            .then(res => { if (Array.isArray(res.data)) setDiagnosesList(res.data); })
            .catch(err => console.error("Error loading diagnoses", err));
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            api.get(`/examinations/patient/${selectedPatientId}`)
                .then(res => { if (Array.isArray(res.data)) setExaminations(res.data); })
                .catch(err => console.error("Error loading history", err));
        }
    }, [selectedPatientId]);

    const handleCreateExamination = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg(''); setErrorMsg('');

        if (!selectedPatientId) return setErrorMsg('Please select a patient!');
        if (!currentDoctorId) return setErrorMsg('Error: Your doctor profile was not found in the database. Please contact Admin.');

        const requestBody = {
            patientId: Number(selectedPatientId),
            doctorId: currentDoctorId,
            examinationDate: new Date().toISOString(),
            diagnosisCode: newExam.diagnosisCode,
            prescribedTreatment: newExam.prescribedTreatment,
            medicalNotes: newExam.medicalNotes,
            price: newExam.price
        };

        try {
            await api.post('/examinations', requestBody);
            setSuccessMsg('Examination recorded successfully!');
            setTimeout(() => setSuccessMsg(''), 5000);

            const res = await api.get(`/examinations/patient/${selectedPatientId}`);
            if (Array.isArray(res.data)) setExaminations(res.data);

            // Изчистване на формата
            setNewExam({ diagnosisCode: '', prescribedTreatment: '', medicalNotes: '', price: 0 });
            setDiagnosisSearch('');
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.response?.data?.message || 'Error recording examination. Please check the diagnosis code.');
        }
    };

    const handleIssueSickLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg(''); setErrorMsg('');
        try {
            await api.post('/sick-leaves', {
                examinationId: sickLeaveExamId,
                startDate: sickLeaveData.startDate,
                durationDays: sickLeaveData.durationDays
            });

            setSessionSickLeaves(prev => ({
                ...prev,
                [sickLeaveExamId!]: { startDate: sickLeaveData.startDate, durationDays: sickLeaveData.durationDays }
            }));

            setExaminations(prev => prev.map(ex =>
                ex.id === sickLeaveExamId ? { ...ex, sickLeave: { startDate: sickLeaveData.startDate, durationDays: sickLeaveData.durationDays } } : ex
            ));

            setSuccessMsg('Sick leave issued successfully!');
            setTimeout(() => setSuccessMsg(''), 5000);
            setSickLeaveExamId(null);
            setSickLeaveData({ startDate: '', durationDays: 1 });
        } catch (error: any) {
            console.error(error);
            setErrorMsg('Error issuing sick leave.');
        }
    };

    const selectedPatient = patients.find(p => p.id === Number(selectedPatientId));

    // Филтриране на диагнозите за търсачката
    const filteredDiagnoses = diagnosesList.filter(d =>
        d.code.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
        d.name.toLowerCase().includes(diagnosisSearch.toLowerCase())
    );

    return (
        <Container className="my-5">
            <h2 className="mb-4 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>
                Doctor Dashboard - Dr. {user.username}
            </h2>

            {successMsg && <Alert variant="success" className="fw-bold shadow-sm">{successMsg}</Alert>}
            {errorMsg && <Alert variant="danger" className="fw-bold shadow-sm">{errorMsg}</Alert>}

            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <Form.Group>
                        <Form.Label className="fw-bold text-muted">Select Patient:</Form.Label>
                        <Form.Select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value === '' ? '' : Number(e.target.value))}
                        >
                            <option value="">-- Select a patient from the list --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (EGN: {p.egn})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    {selectedPatient && !selectedPatient.healthInsured && (
                        <div className="text-danger mt-2 fw-bold small">
                            Warning: This patient does not have active health insurance. The examination must be paid for!
                        </div>
                    )}
                </Card.Body>
            </Card>

            {selectedPatientId && (
                <Tab.Container defaultActiveKey="history">
                    <Nav variant="tabs" className="mb-3 border-bottom-0">
                        <Nav.Item>
                            <Nav.Link eventKey="history" className="fw-bold text-muted">Medical History</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="new-exam" className="fw-bold text-primary">+ New Examination</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        <Tab.Pane eventKey="history">
                            {examinations.length === 0 ? (
                                <p className="text-muted p-3 bg-white rounded shadow-sm">No examinations found for this patient.</p>
                            ) : (
                                examinations.map(exam => {
                                    const activeSickLeave = sessionSickLeaves[exam.id] || exam.sickLeave;

                                    return (
                                        <Card key={exam.id} className="mb-3 border-0 shadow-sm bg-light">
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h5 className="fw-bold mb-0 text-primary">{exam.diagnosisName}</h5>
                                                        <small className="text-muted">{new Date(exam.examinationDate).toLocaleString('en-US')}</small>
                                                    </div>
                                                    <Badge bg={exam.paidByNzok ? 'success' : 'danger'}>
                                                        {exam.paidByNzok ? 'Covered by NHIF' : `Paid: ${exam.price} BGN`}
                                                    </Badge>
                                                </div>
                                                <p className="mb-1"><strong>Doctor:</strong> Dr. {exam.doctor.name}</p>
                                                <p className="mb-1"><strong>Treatment:</strong> {exam.prescribedTreatment}</p>
                                                <p className="mb-3"><strong>Notes:</strong> {exam.medicalNotes}</p>

                                                {/* Индикатор за издаден болничен */}
                                                {activeSickLeave && (
                                                    <Alert variant="warning" className="py-2 px-3 mb-3 border-warning" style={{ backgroundColor: '#fff8e6' }}>
                                                        <strong className="text-warning-emphasis">📅 Active Sick Leave:</strong> {activeSickLeave.durationDays} days starting from {new Date(activeSickLeave.startDate).toLocaleDateString()}
                                                    </Alert>
                                                )}

                                                <div className="d-flex gap-2">
                                                    <Button variant="outline-primary" size="sm">Edit Examination</Button>
                                                    {!activeSickLeave && (
                                                        <Button variant="outline-warning" size="sm" onClick={() => setSickLeaveExamId(exam.id)}>Issue Sick Leave</Button>
                                                    )}
                                                </div>

                                                {sickLeaveExamId === exam.id && (
                                                    <Card className="mt-3 border-warning bg-white shadow-sm">
                                                        <Card.Body>
                                                            <h6 className="fw-bold mb-3 text-warning">New Sick Leave</h6>
                                                            <Form onSubmit={handleIssueSickLeave} className="d-flex gap-3 align-items-end">
                                                                <Form.Group>
                                                                    <Form.Label className="small text-muted mb-1 fw-bold">Start Date</Form.Label>
                                                                    <Form.Control type="date" required size="sm" onChange={e => setSickLeaveData({...sickLeaveData, startDate: e.target.value})} />
                                                                </Form.Group>
                                                                <Form.Group>
                                                                    <Form.Label className="small text-muted mb-1 fw-bold">Duration (days)</Form.Label>
                                                                    <Form.Control type="number" min="1" required size="sm" style={{width: '90px'}} onChange={e => setSickLeaveData({...sickLeaveData, durationDays: Number(e.target.value)})} />
                                                                </Form.Group>
                                                                <Button variant="warning" size="sm" type="submit" className="text-white fw-bold">Save</Button>
                                                                <Button variant="link" size="sm" className="text-muted text-decoration-none fw-bold" onClick={() => setSickLeaveExamId(null)}>Cancel</Button>
                                                            </Form>
                                                        </Card.Body>
                                                    </Card>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    );
                                })
                            )}
                        </Tab.Pane>

                        <Tab.Pane eventKey="new-exam">
                            <Card className="border-0 shadow-sm border-top border-primary border-3">
                                <Card.Body className="p-4">
                                    <Form onSubmit={handleCreateExamination}>

                                        {/* Професионално падащо меню с търсачка */}
                                        <Form.Group className="mb-3 position-relative">
                                            <Form.Label className="fw-bold text-muted">Diagnosis Code (ICD):</Form.Label>
                                            <Form.Control
                                                type="text"
                                                required
                                                placeholder="Type code or diagnosis name..."
                                                value={diagnosisSearch}
                                                autoComplete="off"
                                                onChange={e => {
                                                    setDiagnosisSearch(e.target.value);
                                                    setNewExam({...newExam, diagnosisCode: e.target.value});
                                                    setShowDropdown(true);
                                                }}
                                                onFocus={() => setShowDropdown(true)}
                                                // Забавяне при скриване, за да хванем клика върху опциите
                                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                            />
                                            {showDropdown && filteredDiagnoses.length > 0 && (
                                                <ListGroup className="position-absolute w-100 shadow" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                    {filteredDiagnoses.map(d => (
                                                        <ListGroup.Item
                                                            action
                                                            key={d.code}
                                                            onClick={() => {
                                                                setDiagnosisSearch(`${d.code} - ${d.name}`);
                                                                setNewExam({...newExam, diagnosisCode: d.code});
                                                                setShowDropdown(false);
                                                            }}
                                                        >
                                                            <strong className="text-primary">{d.code}</strong> - {d.name}
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            )}
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold text-muted">Prescribed Treatment:</Form.Label>
                                            <Form.Control as="textarea" rows={3} required value={newExam.prescribedTreatment} onChange={e => setNewExam({...newExam, prescribedTreatment: e.target.value})} />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold text-muted">Medical Notes:</Form.Label>
                                            <Form.Control as="textarea" rows={2} value={newExam.medicalNotes} onChange={e => setNewExam({...newExam, medicalNotes: e.target.value})} />
                                        </Form.Group>

                                        {selectedPatient && !selectedPatient.healthInsured && (
                                            <Form.Group className="mb-4 w-50">
                                                <Form.Label className="fw-bold text-danger">Examination Price (in BGN):</Form.Label>
                                                <Form.Control type="number" required min="0" step="0.50" value={newExam.price} onChange={e => setNewExam({...newExam, price: Number(e.target.value)})} />
                                            </Form.Group>
                                        )}

                                        <Button variant="primary" type="submit" className="w-100 fw-bold p-2 text-uppercase" style={{ letterSpacing: '1px' }}>
                                            Complete Examination
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            )}
            <div className="mt-4 d-flex justify-content-end">
                <Button variant="outline-danger" className="fw-bold px-4" onClick={logout}>
                    Log Out
                </Button>
            </div>
        </Container>
    );
};

export default DoctorDashboard;