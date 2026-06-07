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

interface SickLeave {
    id?: number;
    startDate: string;
    durationDays: number;
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
    sickLeave?: SickLeave;
}

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [examinations, setExaminations] = useState<Examination[]>([]);

    const [diagnosesList, setDiagnosesList] = useState<Diagnosis[]>([]);
    const [newDiagForm, setNewDiagForm] = useState({ code: '', name: '' });
    const [editingDiagCode, setEditingDiagCode] = useState<string | null>(null);
    const [editDiagForm, setEditDiagForm] = useState({ name: '' });

    const [diagnosisSearch, setDiagnosisSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [sessionSickLeaves, setSessionSickLeaves] = useState<Record<number, any>>({});
    const [currentDoctor, setCurrentDoctor] = useState<any>(null);
    const [myExaminations, setMyExaminations] = useState<Examination[]>([]);
    const [myDiagFilter, setMyDiagFilter] = useState('');

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

    const [editingSickLeaveId, setEditingSickLeaveId] = useState<number | null>(null);
    const [editSickLeaveData, setEditSickLeaveData] = useState({ startDate: '', durationDays: 1 });

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

    const fetchDiagnoses = () => {
        api.get('/diagnoses')
            .then(res => {
                if (Array.isArray(res.data)) {
                    // Сортираме по азбучен ред (ICD код), за да не скачат най-отдолу след редакция
                    const sortedDiagnoses = res.data.sort((a: Diagnosis, b: Diagnosis) => a.code.localeCompare(b.code));
                    setDiagnosesList(sortedDiagnoses);
                }
            })
            .catch(err => console.error("Error loading diagnoses", err));
    };

    useEffect(() => {
        api.get('/patients')
            .then(res => { if (Array.isArray(res.data)) setPatients(res.data); })
            .catch(err => console.error("Error loading patients", err));

        fetchDiagnoses();

        api.get('/doctors/me')
            .then(res => {
                if (res.data && res.data.id) {
                    setCurrentDoctor(res.data);
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

    useEffect(() => {
        if (successMsg || errorMsg) {
            const timer = setTimeout(() => {
                setSuccessMsg('');
                setErrorMsg('');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [successMsg, errorMsg]);

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

    const handleCreateDiagnosis = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(''); setSuccessMsg('');
        try {
            await api.post('/diagnoses', newDiagForm);
            setSuccessMsg('Diagnosis added successfully!');
            setNewDiagForm({ code: '', name: '' });
            fetchDiagnoses();
        } catch(err) { setErrorMsg('Failed to add diagnosis.'); }
    };

    const saveDiagnosisEdit = async (code: string) => {
        try {
            await api.put(`/diagnoses/${code}`, { name: editDiagForm.name });
            setSuccessMsg('Diagnosis updated successfully!');
            setEditingDiagCode(null);
            fetchDiagnoses();
        } catch(err) { setErrorMsg('Failed to update diagnosis.'); }
    };

    const deleteDiagnosis = async (code: string) => {
        if (!window.confirm(`Are you sure you want to delete diagnosis ${code}?`)) return;
        try {
            await api.delete(`/diagnoses/${code}`);
            setSuccessMsg('Diagnosis deleted successfully!');
            fetchDiagnoses();
        } catch(err) { setErrorMsg('Cannot delete diagnosis (it might be used in examinations).'); }
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

            loadPatientHistory(Number(selectedPatientId));

            api.get(`/examinations/doctor/${currentDoctor.id}`)
                .then(res => setMyExaminations(res.data));

            setNewExam({ diagnosisCode: '', prescribedTreatment: '', medicalNotes: '', price: 0 });
            setDiagnosisSearch('');
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.response?.data?.message || 'Error recording examination.');
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

            await loadPatientHistory(Number(selectedPatientId));
            setEditingExamId(null);
        } catch (error: any) {
            setErrorMsg('Failed to update examination.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const deleteExam = async (examId: number) => {
        if (!window.confirm('Are you sure you want to delete this examination?')) return;
        try {
            await api.delete(`/examinations/${examId}`);
            setSuccessMsg('Examination deleted successfully!');
            loadPatientHistory(Number(selectedPatientId));
            api.get(`/examinations/doctor/${currentDoctor.id}`).then(res => setMyExaminations(res.data));
        } catch(err) { setErrorMsg('Error deleting examination.'); }
    };

    // --- УПРАВЛЕНИЕ НА БОЛНИЧНИ ---
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
            setSickLeaveExamId(null);
            setSickLeaveData({ startDate: '', durationDays: 1 });
            loadPatientHistory(Number(selectedPatientId));
        } catch (error: any) {
            setErrorMsg('Error issuing sick leave.');
        }
    };

    const saveSickLeaveEdit = async (sickLeaveId: number) => {
        try {
            await api.put(`/sick-leaves/${sickLeaveId}`, editSickLeaveData);
            setSuccessMsg('Sick leave updated successfully!');
            setEditingSickLeaveId(null);
            loadPatientHistory(Number(selectedPatientId));
        } catch(err) { setErrorMsg('Error updating sick leave.'); }
    };

    const deleteSickLeave = async (sickLeaveId: number) => {
        if (!window.confirm('Are you sure you want to delete this sick leave?')) return;
        try {
            await api.delete(`/sick-leaves/${sickLeaveId}`);
            setSuccessMsg('Sick leave deleted successfully!');
            loadPatientHistory(Number(selectedPatientId));
        } catch(err) { setErrorMsg('Error deleting sick leave.'); }
    };

    const selectedPatient = patients.find(p => p.id === Number(selectedPatientId));

    const filteredDiagnosesDropdown = diagnosesList.filter(d =>
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

            <Tab.Container defaultActiveKey="workspace">
                <Nav variant="tabs" className="mb-4 fw-bold border-bottom-0">
                    <Nav.Item>
                        <Nav.Link eventKey="workspace" className="text-primary" style={{ cursor: 'pointer', borderTopLeftRadius: '0.5rem' }}>🏥 Patient Workspace</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="practice" className="text-success" style={{ cursor: 'pointer' }}>📊 My Practice & Reports</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="diagnoses" className="text-info" style={{ cursor: 'pointer', borderTopRightRadius: '0.5rem' }}>🩺 Manage Diagnoses</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>

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
                                                const activeSickLeave = exam.sickLeave || sessionSickLeaves[exam.id];
                                                const isEditing = editingExamId === exam.id;
                                                const isPatientPaid = localPaidExams[exam.id];
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
                                                                        <Badge bg="success" className="p-2">✅ Paid by Patient ({exam.price?.toFixed(2)} BGN)</Badge>
                                                                    ) : (
                                                                        <Badge bg="danger" className="p-2">⚠️ Unpaid: {exam.price?.toFixed(2)} BGN</Badge>
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
                                                                <Alert variant="warning" className="py-2 px-3 mt-3 mb-3 border-warning d-flex justify-content-between align-items-center" style={{ backgroundColor: '#fff8e6' }}>
                                                                    {editingSickLeaveId === activeSickLeave.id && activeSickLeave.id ? (
                                                                        <div className="d-flex gap-2 align-items-center w-100">
                                                                            <strong className="text-warning-emphasis me-2">Edit Sick Leave:</strong>
                                                                            <Form.Control type="date" size="sm" style={{width: 'auto'}} value={editSickLeaveData.startDate} onChange={e => setEditSickLeaveData({...editSickLeaveData, startDate: e.target.value})} />
                                                                            <Form.Control type="number" size="sm" style={{width: '70px'}} value={editSickLeaveData.durationDays} onChange={e => setEditSickLeaveData({...editSickLeaveData, durationDays: Number(e.target.value)})} /> days
                                                                            <Button variant="success" size="sm" className="ms-auto" onClick={() => saveSickLeaveEdit(activeSickLeave.id!)}>Save</Button>
                                                                            <Button variant="secondary" size="sm" onClick={() => setEditingSickLeaveId(null)}>Cancel</Button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <span><strong className="text-warning-emphasis">📅 Active Sick Leave:</strong> {activeSickLeave.durationDays} days starting from {new Date(activeSickLeave.startDate).toLocaleDateString()}</span>
                                                                            {isMyExam && activeSickLeave.id && (
                                                                                <div>
                                                                                    <Button variant="link" size="sm" className="p-0 me-3 text-warning fw-bold text-decoration-none" onClick={() => {
                                                                                        setEditingSickLeaveId(activeSickLeave.id!);
                                                                                        setEditSickLeaveData({startDate: activeSickLeave.startDate, durationDays: activeSickLeave.durationDays});
                                                                                    }}>Edit</Button>
                                                                                    <Button variant="link" size="sm" className="p-0 text-danger fw-bold text-decoration-none" onClick={() => deleteSickLeave(activeSickLeave.id!)}>Delete</Button>
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Alert>
                                                            )}

                                                            {!isEditing && isMyExam && (
                                                                <div className="d-flex gap-2 mt-3">
                                                                    <Button variant="outline-primary" size="sm" onClick={() => startEditing(exam)}>Edit Examination</Button>
                                                                    <Button variant="outline-danger" size="sm" onClick={() => deleteExam(exam.id)}>Delete Examination</Button>
                                                                    {!activeSickLeave && (
                                                                        <Button variant="outline-warning" size="sm" className="ms-auto" onClick={() => setSickLeaveExamId(exam.id)}>+ Issue Sick Leave</Button>
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
                                                        {showDropdown && filteredDiagnosesDropdown.length > 0 && (
                                                            <ListGroup className="position-absolute w-100 shadow" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                                {filteredDiagnosesDropdown.map(d => (
                                                                    <ListGroup.Item action key={d.code} onMouseDown={() => { setDiagnosisSearch(`${d.code} - ${d.name}`); setNewExam({...newExam, diagnosisCode: d.code}); setShowDropdown(false); }}>
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

                    <Tab.Pane eventKey="practice">
                        <Row>
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

                    <Tab.Pane eventKey="diagnoses">
                        <Row>
                            <Col lg={4}>
                                <Card className="border-0 shadow-sm border-top border-info border-3 mb-4">
                                    <Card.Header className="bg-white fw-bold py-3">➕ Add New Diagnosis</Card.Header>
                                    <Card.Body>
                                        <Form onSubmit={handleCreateDiagnosis}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small fw-bold text-muted mb-1">ICD Code</Form.Label>
                                                <Form.Control type="text" placeholder="e.g., J03.9" value={newDiagForm.code} onChange={e => setNewDiagForm({...newDiagForm, code: e.target.value})} required />
                                            </Form.Group>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small fw-bold text-muted mb-1">Diagnosis Name</Form.Label>
                                                <Form.Control type="text" placeholder="e.g., Acute tonsillitis" value={newDiagForm.name} onChange={e => setNewDiagForm({...newDiagForm, name: e.target.value})} required />
                                            </Form.Group>
                                            <Button variant="info" type="submit" className="w-100 fw-bold text-white">Add Diagnosis</Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={8}>
                                <Card className="border-0 shadow-sm border-top border-secondary border-3">
                                    <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                                        <span>Diagnoses Dictionary ({diagnosesList.length})</span>
                                    </Card.Header>
                                    <Card.Body className="p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                        <Table hover className="mb-0 align-middle">
                                            <thead className="table-light small">
                                            <tr>
                                                <th className="ps-4 w-25">ICD Code</th>
                                                <th>Name</th>
                                                <th className="text-end pe-4">Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {diagnosesList.map(d => (
                                                <tr key={d.code}>
                                                    <td className="ps-4 fw-bold text-primary">{d.code}</td>
                                                    {editingDiagCode === d.code ? (
                                                        <>
                                                            <td><Form.Control size="sm" value={editDiagForm.name} onChange={e => setEditDiagForm({name: e.target.value})} /></td>
                                                            <td className="text-end pe-4 text-nowrap">
                                                                <Button variant="success" size="sm" className="me-1" onClick={() => saveDiagnosisEdit(d.code)}>Save</Button>
                                                                <Button variant="secondary" size="sm" onClick={() => setEditingDiagCode(null)}>Cancel</Button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>{d.name}</td>
                                                            <td className="text-end pe-4 text-nowrap">
                                                                <Button variant="outline-primary" size="sm" className="me-1" onClick={() => { setEditingDiagCode(d.code); setEditDiagForm({name: d.name}); }}>Edit</Button>
                                                                <Button variant="outline-danger" size="sm" onClick={() => deleteDiagnosis(d.code)}>Del</Button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                            {diagnosesList.length === 0 && (
                                                <tr><td colSpan={3} className="text-center text-muted p-4">No diagnoses found in the system.</td></tr>
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