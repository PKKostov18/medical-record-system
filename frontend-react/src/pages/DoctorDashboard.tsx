import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Badge, Nav, Tab, Alert, ListGroup, Spinner, Row, Col, Table, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

interface Patient {
    id: number;
    name: string;
    egn: string;
    healthInsured: boolean;
    personalDoctorId?: number;
    personalDoctorName?: string;
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
    sickLeave?: { startDate: string, durationDays: number };
}

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [examinations, setExaminations] = useState<Examination[]>([]);
    const [diagnosesList, setDiagnosesList] = useState<Diagnosis[]>([]);

    const [diagnosisSearch, setDiagnosisSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [sessionSickLeaves, setSessionSickLeaves] = useState<Record<number, any>>({});

    // ПРОМЯНА: Записваме целия обект на лекаря, за да знаем дали е GP
    const [currentDoctor, setCurrentDoctor] = useState<any>(null);

    // --- НОВИ СЪСТОЯНИЯ ЗА СТАТИСТИКИТЕ ---
    const [myExaminations, setMyExaminations] = useState<Examination[]>([]);
    const [myDiagFilter, setMyDiagFilter] = useState('');
    // --------------------------------------

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

    const [editingExamId, setEditingExamId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState({
        prescribedTreatment: '',
        medicalNotes: '',
        price: 0
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [localPaidExams, setLocalPaidExams] = useState<Record<number, boolean>>({});

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

        api.get('/diagnoses')
            .then(res => { if (Array.isArray(res.data)) setDiagnosesList(res.data); })
            .catch(err => console.error("Error loading diagnoses", err));

        api.get('/doctors/me')
            .then(res => {
                if (res.data && res.data.id) {
                    setCurrentDoctor(res.data);

                    // Извличаме историята на този конкретен лекар за статистиките
                    api.get(`/examinations/doctor/${res.data.id}`)
                        .then(examsRes => setMyExaminations(examsRes.data))
                        .catch(err => console.error("Could not load doctor's history", err));
                }
            })
            .catch(err => console.error("Your doctor profile is missing", err));
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            loadPatientHistory(Number(selectedPatientId));

            const savedPayments = localStorage.getItem('paid_examinations');
            if (savedPayments) {
                setLocalPaidExams(JSON.parse(savedPayments));
            } else {
                setLocalPaidExams({});
            }
        }
    }, [selectedPatientId]);

    const loadPatientHistory = async (patientId: number) => {
        try {
            const res = await api.get(`/examinations/patient/${patientId}`);
            if (Array.isArray(res.data)) {
                const sorted = res.data.sort((a, b) => b.id - a.id);
                setExaminations(sorted);
            }
        } catch (err) {
            console.error("Error loading history", err);
        }
    };

    const handleCreateExamination = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg(''); setErrorMsg('');

        if (!selectedPatientId) return setErrorMsg('Please select a patient!');
        if (!currentDoctor) return setErrorMsg('Error: Your doctor profile was not found. Please contact Admin.');

        const requestBody = {
            patientId: Number(selectedPatientId),
            doctorId: currentDoctor.id,
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

            loadPatientHistory(Number(selectedPatientId));

            // Презареждаме и историята на лекаря, за да се обнови справката веднага
            api.get(`/examinations/doctor/${currentDoctor.id}`)
                .then(res => setMyExaminations(res.data));

            setNewExam({ diagnosisCode: '', prescribedTreatment: '', medicalNotes: '', price: 0 });
            setDiagnosisSearch('');
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.response?.data?.message || 'Error recording examination.');
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

    const startEditing = (exam: Examination) => {
        setEditingExamId(exam.id);
        setEditFormData({
            prescribedTreatment: exam.prescribedTreatment,
            medicalNotes: exam.medicalNotes || '',
            price: exam.price || 0
        });
        setSickLeaveExamId(null);
    };

    const cancelEditing = () => {
        setEditingExamId(null);
        setEditFormData({ prescribedTreatment: '', medicalNotes: '', price: 0 });
    };

    const handleSaveEdit = async (examId: number) => {
        setIsSavingEdit(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await api.put(`/examinations/${examId}`, editFormData);
            setSuccessMsg('Examination updated successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);

            await loadPatientHistory(Number(selectedPatientId));
            setEditingExamId(null);
        } catch (error: any) {
            console.error(error);
            setErrorMsg('Failed to update examination. Ensure backend supports PUT /api/examinations/{id}.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const selectedPatient = patients.find(p => p.id === Number(selectedPatientId));
    const filteredDiagnoses = diagnosesList.filter(d =>
        d.code.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
        d.name.toLowerCase().includes(diagnosisSearch.toLowerCase())
    );

    const myRegisteredPatients = currentDoctor?.gp
        ? patients.filter(p => {
            const idMatch = p.personalDoctorId && String(p.personalDoctorId) === String(currentDoctor.id);
            const nameMatch = p.personalDoctorName && currentDoctor.name &&
                p.personalDoctorName.toLowerCase().trim() === currentDoctor.name.toLowerCase().trim();

            return idMatch || nameMatch;
        })
        : [];

    const filteredMyExaminations = myExaminations.filter(e =>
        e.diagnosisName?.toLowerCase().includes(myDiagFilter.toLowerCase())
    );

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>
                    Doctor Dashboard - Dr. {user.username}
                </h2>
                <Button variant="outline-danger" className="fw-bold px-4" onClick={() => { logout(); navigate('/login'); }}>
                    Log Out
                </Button>
            </div>

            {successMsg && <Alert variant="success" className="fw-bold shadow-sm">{successMsg}</Alert>}
            {errorMsg && <Alert variant="danger" className="fw-bold shadow-sm">{errorMsg}</Alert>}

            {/* ОСНОВНА НАВИГАЦИЯ МЕЖДУ РАБОТЕН ИЗГЛЕД И СТАТИСТИКИ */}
            <Tab.Container defaultActiveKey="workspace">
                <Nav variant="tabs" className="mb-4 fw-bold border-bottom-0">
                    <Nav.Item>
                        <Nav.Link eventKey="workspace" className="text-primary" style={{ cursor: 'pointer', borderTopLeftRadius: '0.5rem' }}>🏥 Patient Workspace</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="practice" className="text-success" style={{ cursor: 'pointer', borderTopRightRadius: '0.5rem' }}>📊 My Practice & Reports</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>

                    {/* --- ТАБ 1: СТАНДАРТНОТО РАБОТНО ПРОСТРАНСТВО --- */}
                    <Tab.Pane eventKey="workspace">
                        <Card className="mb-4 shadow-sm border-0 border-top border-primary border-3">
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
                                        <Nav.Link eventKey="history" className="fw-bold text-muted" style={{ cursor: 'pointer' }}>Medical History</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="new-exam" className="fw-bold text-primary" style={{ cursor: 'pointer' }}>+ New Examination</Nav.Link>
                                    </Nav.Item>
                                </Nav>

                                <Tab.Content>
                                    <Tab.Pane eventKey="history">
                                        {examinations.length === 0 ? (
                                            <p className="text-muted p-3 bg-white rounded shadow-sm">No examinations found for this patient.</p>
                                        ) : (
                                            examinations.map(exam => {
                                                const activeSickLeave = sessionSickLeaves[exam.id] || exam.sickLeave;
                                                const isEditing = editingExamId === exam.id;
                                                const isPatientPaid = localPaidExams[exam.id];

                                                // --- НОВО: Проверяваме дали прегледът е извършен от този лекар ---
                                                const isMyExam = currentDoctor && exam.doctor?.id === currentDoctor.id;

                                                return (
                                                    <Card key={exam.id} className={`mb-3 border-0 shadow-sm ${isEditing ? 'bg-white border-primary' : 'bg-light'}`} style={isEditing ? { borderLeft: '4px solid #0d6efd' } : {}}>
                                                        <Card.Body>
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <div>
                                                                    <h5 className="fw-bold mb-0 text-primary">{exam.diagnosisName}</h5>
                                                                    <small className="text-muted">{new Date(exam.examinationDate).toLocaleString('en-US')}</small>
                                                                </div>

                                                                <div>
                                                                    {exam.paidByNzok ? (
                                                                        <Badge bg="success" className="p-2">Covered by NHIF</Badge>
                                                                    ) : isPatientPaid ? (
                                                                        <Badge bg="success" className="p-2">✅ Paid by Patient ({exam.price.toFixed(2)} BGN)</Badge>
                                                                    ) : (
                                                                        <Badge bg="danger" className="p-2">⚠️ Unpaid: {exam.price.toFixed(2)} BGN</Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isEditing ? (
                                                                <div className="mt-3 p-3 bg-light rounded border">
                                                                    <Form.Group className="mb-2">
                                                                        <Form.Label className="small fw-bold text-muted mb-1">Prescribed Treatment</Form.Label>
                                                                        <Form.Control
                                                                            as="textarea" rows={2} size="sm"
                                                                            value={editFormData.prescribedTreatment}
                                                                            onChange={e => setEditFormData({...editFormData, prescribedTreatment: e.target.value})}
                                                                        />
                                                                    </Form.Group>
                                                                    <Form.Group className="mb-2">
                                                                        <Form.Label className="small fw-bold text-muted mb-1">Medical Notes</Form.Label>
                                                                        <Form.Control
                                                                            as="textarea" rows={2} size="sm"
                                                                            value={editFormData.medicalNotes}
                                                                            onChange={e => setEditFormData({...editFormData, medicalNotes: e.target.value})}
                                                                        />
                                                                    </Form.Group>

                                                                    {!exam.paidByNzok && (
                                                                        <Form.Group className="mb-3 w-25">
                                                                            <Form.Label className="small fw-bold text-danger mb-1">Price (BGN)</Form.Label>
                                                                            <Form.Control
                                                                                type="number" min="0" step="0.50" size="sm"
                                                                                value={editFormData.price}
                                                                                onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})}
                                                                            />
                                                                        </Form.Group>
                                                                    )}

                                                                    <div className="d-flex gap-2">
                                                                        <Button variant="success" size="sm" className="fw-bold" onClick={() => handleSaveEdit(exam.id)} disabled={isSavingEdit}>
                                                                            {isSavingEdit ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                                                                        </Button>
                                                                        <Button variant="outline-secondary" size="sm" className="fw-bold" onClick={cancelEditing} disabled={isSavingEdit}>
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="mb-1"><strong>Doctor:</strong> Dr. {exam.doctor.name}</p>
                                                                    <p className="mb-1"><strong>Treatment:</strong> {exam.prescribedTreatment}</p>
                                                                    <p className="mb-3"><strong>Notes:</strong> {exam.medicalNotes}</p>
                                                                </>
                                                            )}

                                                            {activeSickLeave && (
                                                                <Alert variant="warning" className="py-2 px-3 mt-3 mb-3 border-warning" style={{ backgroundColor: '#fff8e6' }}>
                                                                    <strong className="text-warning-emphasis">📅 Active Sick Leave:</strong> {activeSickLeave.durationDays} days starting from {new Date(activeSickLeave.startDate).toLocaleDateString()}
                                                                </Alert>
                                                            )}

                                                            {/* ПРОМЯНА: Показваме бутоните САМО ако прегледът е на логнатия лекар */}
                                                            {!isEditing && isMyExam && (
                                                                <div className="d-flex gap-2">
                                                                    <Button variant="outline-primary" size="sm" onClick={() => startEditing(exam)}>Edit Examination</Button>
                                                                    {!activeSickLeave && (
                                                                        <Button variant="outline-warning" size="sm" onClick={() => setSickLeaveExamId(exam.id)}>Issue Sick Leave</Button>
                                                                    )}
                                                                </div>
                                                            )}

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
                                                    <Form.Group className="mb-3 position-relative">
                                                        <Form.Label className="fw-bold text-muted">Diagnosis Code (ICD):</Form.Label>
                                                        <Form.Control
                                                            type="text" required placeholder="Type code or diagnosis name..."
                                                            value={diagnosisSearch} autoComplete="off"
                                                            onChange={e => { setDiagnosisSearch(e.target.value); setNewExam({...newExam, diagnosisCode: e.target.value}); setShowDropdown(true); }}
                                                            onFocus={() => setShowDropdown(true)}
                                                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                                        />
                                                        {showDropdown && filteredDiagnoses.length > 0 && (
                                                            <ListGroup className="position-absolute w-100 shadow" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                                {filteredDiagnoses.map(d => (
                                                                    <ListGroup.Item action key={d.code} onClick={() => { setDiagnosisSearch(`${d.code} - ${d.name}`); setNewExam({...newExam, diagnosisCode: d.code}); setShowDropdown(false); }}>
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
                    </Tab.Pane>

                    {/* --- ТАБ 2: СТАТИСТИКИ И СПРАВКИ НА ЛЕКАРЯ --- */}
                    <Tab.Pane eventKey="practice">
                        <Row>
                            {/* Списък с пациенти на личния лекар (Показва се само ако е GP) */}
                            {currentDoctor?.gp && (
                                <Col lg={4} className="mb-4">
                                    <Card className="border-0 shadow-sm h-100 border-top border-success border-3">
                                        <Card.Header className="bg-white py-3">
                                            <h6 className="fw-bold mb-0 text-success">My Registered Patients ({myRegisteredPatients.length})</h6>
                                        </Card.Header>
                                        <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <Table hover className="mb-0 small">
                                                <thead className="table-light">
                                                <tr><th className="ps-3">Name</th><th>EGN</th></tr>
                                                </thead>
                                                <tbody>
                                                {myRegisteredPatients.map(p => (
                                                    <tr key={p.id}>
                                                        <td className="ps-3 fw-bold">{p.name}</td>
                                                        <td>{p.egn}</td>
                                                    </tr>
                                                ))}
                                                {myRegisteredPatients.length === 0 && (
                                                    <tr><td colSpan={2} className="text-center p-4 text-muted">You have no registered patients yet.</td></tr>
                                                )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            )}

                            {/* Списък на пациенти по диагноза */}
                            <Col lg={currentDoctor?.gp ? 8 : 12} className="mb-4">
                                <Card className="border-0 shadow-sm h-100 border-top border-info border-3">
                                    <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                        <h6 className="fw-bold mb-0 text-info">Find Patients by Diagnosis</h6>
                                        <InputGroup size="sm" style={{ width: '250px' }}>
                                            <InputGroup.Text>🔍</InputGroup.Text>
                                            <Form.Control
                                                placeholder="Type diagnosis name..."
                                                value={myDiagFilter}
                                                onChange={e => setMyDiagFilter(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Card.Header>
                                    <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <Table hover className="mb-0 text-sm">
                                            <thead className="table-light text-muted small">
                                            <tr>
                                                <th className="ps-3">Patient Name</th>
                                                <th>Date</th>
                                                <th>Diagnosis</th>
                                                <th>Treatment</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filteredMyExaminations.map(e => (
                                                <tr key={e.id}>
                                                    <td className="ps-3 fw-bold">{e.patient?.name || 'Unknown'}</td>
                                                    <td>{new Date(e.examinationDate).toLocaleDateString()}</td>
                                                    <td><Badge bg="info" className="text-dark">{e.diagnosisName}</Badge></td>
                                                    <td className="text-truncate" style={{ maxWidth: '200px' }}>{e.prescribedTreatment}</td>
                                                </tr>
                                            ))}
                                            {filteredMyExaminations.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="text-center p-4 text-muted">
                                                        No records found. Try searching for another diagnosis.
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Container>
    );
};

export default DoctorDashboard;