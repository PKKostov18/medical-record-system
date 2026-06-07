import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Nav, Table, Badge, Spinner, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Състояния за базите данни
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patientsList, setPatientsList] = useState<any[]>([]);
    const [examinations, setExaminations] = useState<any[]>([]);

    // Филтри за базата данни
    const [examFilterDiag, setExamFilterDiag] = useState('');
    const [examFilterDate, setExamFilterDate] = useState('');

    // Състояния за бекенд статистиките
    const [stats, setStats] = useState({
        mostCommonDiagnosis: null as any,
        visitsPerDoctor: {} as Record<string, number>
    });

    const [loadingData, setLoadingData] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Състояния за формите за регистрация
    const [doctorFormData, setDoctorFormData] = useState({
        name: '', uin: '', specialty: '', isGp: false, username: '', email: '', password: ''
    });

    const [patientFormData, setPatientFormData] = useState({
        name: '', egn: '', isHealthInsured: false, personalDoctorId: '', username: '', email: '', password: ''
    });

    // --- Състояния за INLINE EDIT ---
    const [editingDoctorId, setEditingDoctorId] = useState<number | null>(null);
    const [editDoctorForm, setEditDoctorForm] = useState({ name: '', specialty: '', isGp: false });

    const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
    const [editPatientForm, setEditPatientForm] = useState({ name: '', egn: '', isHealthInsured: false });

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:9000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    // --- НОВО: Функции за автоматично скриване на съобщенията ---
    const showSuccess = (message: string) => {
        setSuccessMsg(message);
        setTimeout(() => setSuccessMsg(''), 3000); // Скрива се след 3 секунди
    };

    const showError = (message: string) => {
        setErrorMsg(message);
        setTimeout(() => setErrorMsg(''), 5000); // Скрива се след 5 секунди
    };
    // -------------------------------------------------------------

    const loadSystemData = async () => {
        setLoadingData(true);
        try {
            const docsRes = await api.get('/doctors');
            if (Array.isArray(docsRes.data)) {
                // Сортираме по ID, за да запазим подредбата след редакция
                const sortedDoctors = [...docsRes.data].sort((a, b) => a.id - b.id);
                setDoctors(sortedDoctors);
            }

            const patsRes = await api.get('/patients');
            if (Array.isArray(patsRes.data)) {
                // Сортираме по ID, за да запазим подредбата след редакция
                const sortedPatients = [...patsRes.data].sort((a, b) => a.id - b.id);
                setPatientsList(sortedPatients);
            }

            try {
                const examsRes = await api.get('/examinations/all');
                if (Array.isArray(examsRes.data)) {
                    // Сортираме и прегледите по ID (ако е необходимо)
                    const sortedExams = [...examsRes.data].sort((a, b) => a.id - b.id);
                    setExaminations(sortedExams);
                }
            } catch (e) { console.warn("Endpoint /examinations/all not found yet."); }

            try {
                const diagRes = await api.get('/examinations/stats/most-common-diagnosis');
                const visitsRes = await api.get('/examinations/stats/visits/per-doctor');

                setStats({
                    mostCommonDiagnosis: diagRes.data || null,
                    visitsPerDoctor: visitsRes.data || {}
                });
            } catch (e) { console.warn("Some statistics endpoints are not returning data yet."); }

        } catch (err) {
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (user && ['ADMIN', 'ROLE_ADMIN'].some(r => user.roles.includes(r))) {
            loadSystemData();
        }
    }, [user]);

    if (!user || (!['ADMIN', 'ROLE_ADMIN'].some(r => user.roles.includes(r)))) {
        return <Navigate to="/dashboard" />;
    }

    // --- ФУНКЦИИ ЗА СЪЗДАВАНЕ ---
    const handleDoctorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...doctorFormData, gp: doctorFormData.isGp };
            await api.post('/doctors', payload);
            showSuccess('Doctor registered successfully!');
            setDoctorFormData({ name: '', uin: '', specialty: '', isGp: false, username: '', email: '', password: '' });
            loadSystemData();
        } catch (err: any) { showError(err.response?.data?.message || 'Failed to register doctor.'); }
    };

    const handlePatientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...patientFormData, healthInsured: patientFormData.isHealthInsured,
                personalDoctorId: patientFormData.personalDoctorId ? Number(patientFormData.personalDoctorId) : null
            };
            await api.post('/patients', payload);
            showSuccess('Patient registered successfully!');
            setPatientFormData({ name: '', egn: '', isHealthInsured: false, personalDoctorId: '', username: '', email: '', password: '' });
            loadSystemData();
        } catch (err: any) { showError(err.response?.data?.message || 'Failed to register patient.'); }
    };

    // --- ФУНКЦИИ ЗА РЕДАКТИРАНЕ И ИЗТРИВАНЕ (CRUD) ---

    // Функции за Лекари
    const startEditDoctor = (doctor: any) => {
        setEditingDoctorId(doctor.id);
        setEditDoctorForm({ name: doctor.name, specialty: doctor.specialty, isGp: doctor.gp });
    };

    const saveDoctor = async (id: number) => {
        try {
            await api.put(`/doctors/${id}`, { ...editDoctorForm, gp: editDoctorForm.isGp });
            showSuccess('Doctor updated successfully!');
            setEditingDoctorId(null);
            loadSystemData();
        } catch (err) { showError('Error updating doctor. Make sure PUT /api/doctors/{id} exists.'); }
    };

    const deleteDoctor = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this doctor?')) return;
        try {
            await api.delete(`/doctors/${id}`);
            showSuccess('Doctor deleted successfully!');
            loadSystemData();
        } catch (err) { showError('Cannot delete doctor. They might have connected examinations.'); }
    };

    // Функции за Пациенти
    const startEditPatient = (patient: any) => {
        setEditingPatientId(patient.id);
        setEditPatientForm({ name: patient.name, egn: patient.egn, isHealthInsured: patient.healthInsured });
    };

    const savePatient = async (id: number) => {
        try {
            await api.put(`/patients/${id}`, { ...editPatientForm, healthInsured: editPatientForm.isHealthInsured });
            showSuccess('Patient updated successfully!');
            setEditingPatientId(null);
            loadSystemData();
        } catch (err) { showError('Error updating patient. Make sure PUT /api/patients/{id} exists.'); }
    };

    const deletePatient = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this patient?')) return;
        try {
            await api.delete(`/patients/${id}`);
            showSuccess('Patient deleted successfully!');
            loadSystemData();
        } catch (err) { showError('Cannot delete patient. They might have connected examinations.'); }
    };
    // -------------------------------------------------------

    // --- ФРОНТЕНД СТАТИСТИКИ ---
    const localPaidExams = JSON.parse(localStorage.getItem('paid_examinations') || '{}');
    let actualRevenue = 0;
    const revenuePerDoctor: Record<string, number> = {};
    const sickLeavesByDoctor: Record<string, number> = {};
    const sickLeavesByMonth: Record<string, number> = {};
    const patientsPerGp: Record<string, number> = {};

    doctors.filter(d => d.gp).forEach(doc => {
        const count = patientsList.filter(p => p.personalDoctorId === doc.id || p.personalDoctorName === doc.name).length;
        patientsPerGp[`Dr. ${doc.name}`] = count;
    });

    examinations.forEach(exam => {
        const docName = `Dr. ${exam.doctor?.name}`;

        if (!exam.paidByNzok && localPaidExams[exam.id]) {
            actualRevenue += (exam.price || 0);
            revenuePerDoctor[docName] = (revenuePerDoctor[docName] || 0) + (exam.price || 0);
        }

        if (exam.sickLeave) {
            sickLeavesByDoctor[docName] = (sickLeavesByDoctor[docName] || 0) + 1;
            const dateStr = exam.sickLeave.startDate || exam.examinationDate;
            if (dateStr) {
                const monthYear = new Date(dateStr).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                sickLeavesByMonth[monthYear] = (sickLeavesByMonth[monthYear] || 0) + 1;
            }
        }
    });

    const topSickLeaveDoctor = Object.entries(sickLeavesByDoctor).sort((a, b) => b[1] - a[1])[0] || null;
    const topSickLeaveMonth = Object.entries(sickLeavesByMonth).sort((a, b) => b[1] - a[1])[0] || null;

    const filteredExaminations = examinations.filter(e => {
        const matchDiag = e.diagnosisName?.toLowerCase().includes(examFilterDiag.toLowerCase());
        const matchDate = examFilterDate ? e.examinationDate.startsWith(examFilterDate) : true;
        return matchDiag && matchDate;
    });
    // ----------------------------------------------------

    return (
        <Container className="py-5" style={{ maxWidth: '1400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase text-dark" style={{ letterSpacing: '1px' }}>
                    Administration Portal
                </h2>
                <Button variant="outline-danger" className="fw-bold px-4" onClick={() => { logout(); navigate('/login'); }}>
                    Log Out
                </Button>
            </div>

            {successMsg && <Alert variant="success" className="fw-bold shadow-sm" onClose={() => setSuccessMsg('')} dismissible>{successMsg}</Alert>}
            {errorMsg && <Alert variant="danger" className="fw-bold shadow-sm" onClose={() => setErrorMsg('')} dismissible>{errorMsg}</Alert>}

            <Tab.Container defaultActiveKey="database">
                <Nav variant="pills" className="mb-4 bg-light p-2 rounded shadow-sm d-flex justify-content-center gap-2">
                    <Nav.Item>
                        <Nav.Link eventKey="database" className="fw-bold px-4">🗄️ System Database</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="registry" className="fw-bold px-4">➕ New Registration</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="stats" className="fw-bold px-4">📊 Reports & Stats</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>

                    {/* --- ТАБ 1: ДОСТЪП ДО ВСИЧКИ ДАННИ --- */}
                    <Tab.Pane eventKey="database">
                        {loadingData ? <div className="text-center my-5"><Spinner animation="border" /></div> : (
                            <Row>
                                {/* --- ТАБЛИЦА ЛЕКАРИ --- */}
                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm mb-4 border-top border-primary border-3">
                                        <Card.Header className="bg-white fw-bold py-3">Registered Doctors ({doctors.length})</Card.Header>
                                        <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <Table hover responsive className="mb-0 align-middle">
                                                <thead className="table-light text-muted small">
                                                <tr>
                                                    <th className="ps-3">Name</th>
                                                    <th>Specialty</th>
                                                    <th>Role</th>
                                                    <th className="text-end pe-3">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {doctors.map(d => (
                                                    <tr key={d.id}>
                                                        {editingDoctorId === d.id ? (
                                                            // ИЗГЛЕД ПРИ РЕДАКЦИЯ
                                                            <>
                                                                <td className="ps-3">
                                                                    <Form.Control size="sm" value={editDoctorForm.name} onChange={e => setEditDoctorForm({...editDoctorForm, name: e.target.value})} />
                                                                </td>
                                                                <td>
                                                                    <Form.Control size="sm" value={editDoctorForm.specialty} onChange={e => setEditDoctorForm({...editDoctorForm, specialty: e.target.value})} />
                                                                </td>
                                                                <td>
                                                                    <Form.Check type="checkbox" label="GP" checked={editDoctorForm.isGp} onChange={e => setEditDoctorForm({...editDoctorForm, isGp: e.target.checked})} />
                                                                </td>
                                                                <td className="text-end pe-3 text-nowrap">
                                                                    <Button variant="success" size="sm" className="me-1" onClick={() => saveDoctor(d.id)}>Save</Button>
                                                                    <Button variant="secondary" size="sm" onClick={() => setEditingDoctorId(null)}>Cancel</Button>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            // НОРМАЛЕН ИЗГЛЕД ЗА ЧЕТЕНЕ
                                                            <>
                                                                <td className="ps-3 fw-bold">Dr. {d.name}</td>
                                                                <td>{d.specialty}</td>
                                                                <td>{d.gp ? <Badge bg="primary">GP</Badge> : <Badge bg="secondary">Specialist</Badge>}</td>
                                                                <td className="text-end pe-3 text-nowrap">
                                                                    <Button variant="outline-primary" size="sm" className="me-1 fw-bold" onClick={() => startEditDoctor(d)}>Edit</Button>
                                                                    <Button variant="outline-danger" size="sm" className="fw-bold" onClick={() => deleteDoctor(d.id)}>Delete</Button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* --- ТАБЛИЦА ПАЦИЕНТИ --- */}
                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm mb-4 border-top border-success border-3">
                                        <Card.Header className="bg-white fw-bold py-3">Registered Patients ({patientsList.length})</Card.Header>
                                        <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <Table hover responsive className="mb-0 align-middle">
                                                <thead className="table-light text-muted small">
                                                <tr>
                                                    <th className="ps-3">Name</th>
                                                    <th>EGN</th>
                                                    <th>Insurance</th>
                                                    <th className="text-end pe-3">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {patientsList.map(p => (
                                                    <tr key={p.id}>
                                                        {editingPatientId === p.id ? (
                                                            // ИЗГЛЕД ПРИ РЕДАКЦИЯ
                                                            <>
                                                                <td className="ps-3">
                                                                    <Form.Control size="sm" value={editPatientForm.name} onChange={e => setEditPatientForm({...editPatientForm, name: e.target.value})} />
                                                                </td>
                                                                <td>
                                                                    <Form.Control size="sm" value={editPatientForm.egn} onChange={e => setEditPatientForm({...editPatientForm, egn: e.target.value})} />
                                                                </td>
                                                                <td>
                                                                    <Form.Check type="checkbox" label="Insured" checked={editPatientForm.isHealthInsured} onChange={e => setEditPatientForm({...editPatientForm, isHealthInsured: e.target.checked})} />
                                                                </td>
                                                                <td className="text-end pe-3 text-nowrap">
                                                                    <Button variant="success" size="sm" className="me-1" onClick={() => savePatient(p.id)}>Save</Button>
                                                                    <Button variant="secondary" size="sm" onClick={() => setEditingPatientId(null)}>Cancel</Button>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            // НОРМАЛЕН ИЗГЛЕД ЗА ЧЕТЕНЕ
                                                            <>
                                                                <td className="ps-3 fw-bold">{p.name}</td>
                                                                <td>{p.egn}</td>
                                                                <td>{p.healthInsured ? <Badge bg="success">Yes</Badge> : <Badge bg="danger">No</Badge>}</td>
                                                                <td className="text-end pe-3 text-nowrap">
                                                                    <Button variant="outline-primary" size="sm" className="me-1 fw-bold" onClick={() => startEditPatient(p)}>Edit</Button>
                                                                    <Button variant="outline-danger" size="sm" className="fw-bold" onClick={() => deletePatient(p.id)}>Delete</Button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* --- ИСТОРИЯ НА ПРЕГЛЕДИТЕ --- */}
                                <Col lg={12}>
                                    <Card className="border-0 shadow-sm mb-4 border-top border-warning border-3">
                                        <Card.Header className="bg-white py-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="fw-bold">All Examinations History ({filteredExaminations.length})</span>
                                            </div>
                                            <Row className="g-2">
                                                <Col md={6}>
                                                    <InputGroup size="sm">
                                                        <InputGroup.Text>🔍 Diagnosis</InputGroup.Text>
                                                        <Form.Control placeholder="Type to filter by diagnosis..." value={examFilterDiag} onChange={e => setExamFilterDiag(e.target.value)} />
                                                    </InputGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <InputGroup size="sm">
                                                        <InputGroup.Text>📅 Date</InputGroup.Text>
                                                        <Form.Control type="date" value={examFilterDate} onChange={e => setExamFilterDate(e.target.value)} />
                                                        <Button variant="outline-secondary" onClick={() => setExamFilterDate('')}>Clear</Button>
                                                    </InputGroup>
                                                </Col>
                                            </Row>
                                        </Card.Header>
                                        <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <Table hover responsive className="mb-0 text-sm">
                                                <thead className="table-light text-muted small">
                                                <tr>
                                                    <th className="ps-4">Date</th>
                                                    <th>Doctor</th>
                                                    <th>Diagnosis</th>
                                                    <th>Financial</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {filteredExaminations.map(e => (
                                                    <tr key={e.id}>
                                                        <td className="ps-4">{new Date(e.examinationDate).toLocaleDateString()}</td>
                                                        <td className="fw-bold">Dr. {e.doctor?.name}</td>
                                                        <td>{e.diagnosisName}</td>
                                                        <td>{e.paidByNzok ? <Badge bg="success">NHIF</Badge> : (localPaidExams[e.id] ? <Badge bg="success">Paid ({e.price} BGN)</Badge> : <Badge bg="danger">Unpaid ({e.price} BGN)</Badge>)}</td>
                                                    </tr>
                                                ))}
                                                {filteredExaminations.length === 0 && (
                                                    <tr><td colSpan={4} className="text-center p-4 text-muted">No examinations match your filters.</td></tr>
                                                )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        )}
                    </Tab.Pane>

                    {/* --- ТАБ 2: РЕГИСТРАЦИЯ --- */}
                    <Tab.Pane eventKey="registry">
                        <Card className="glass-panel border-0 mb-5 shadow-sm">
                            <Card.Body>
                                <Tab.Container defaultActiveKey="doctor">
                                    <Nav variant="tabs" className="mb-4">
                                        <Nav.Item><Nav.Link eventKey="doctor" className="fw-bold text-dark">Add Doctor</Nav.Link></Nav.Item>
                                        <Nav.Item><Nav.Link eventKey="patient" className="fw-bold text-dark">Add Patient</Nav.Link></Nav.Item>
                                    </Nav>
                                    <Tab.Content>
                                        <Tab.Pane eventKey="doctor">
                                            <Form onSubmit={handleDoctorSubmit} className="p-3">
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Full Name</Form.Label>
                                                            <Form.Control type="text" value={doctorFormData.name} onChange={e => setDoctorFormData({ ...doctorFormData, name: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">UIN</Form.Label>
                                                            <Form.Control type="text" value={doctorFormData.uin} onChange={e => setDoctorFormData({ ...doctorFormData, uin: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Specialty</Form.Label>
                                                            <Form.Control type="text" value={doctorFormData.specialty} onChange={e => setDoctorFormData({ ...doctorFormData, specialty: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Check type="checkbox" label="Is General Practitioner (GP)?" checked={doctorFormData.isGp} onChange={e => setDoctorFormData({ ...doctorFormData, isGp: e.target.checked })} className="text-dark fw-bold" />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Username</Form.Label>
                                                            <Form.Control type="text" value={doctorFormData.username} onChange={e => setDoctorFormData({ ...doctorFormData, username: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Email</Form.Label>
                                                            <Form.Control type="email" value={doctorFormData.email} onChange={e => setDoctorFormData({ ...doctorFormData, email: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Password</Form.Label>
                                                            <Form.Control type="password" value={doctorFormData.password} onChange={e => setDoctorFormData({ ...doctorFormData, password: e.target.value })} required />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                                <Button variant="primary" type="submit" className="mt-3 px-4 fw-bold">Register Doctor</Button>
                                            </Form>
                                        </Tab.Pane>
                                        <Tab.Pane eventKey="patient">
                                            <Form onSubmit={handlePatientSubmit} className="p-3">
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Full Name</Form.Label>
                                                            <Form.Control type="text" value={patientFormData.name} onChange={e => setPatientFormData({ ...patientFormData, name: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">EGN</Form.Label>
                                                            <Form.Control type="text" value={patientFormData.egn} onChange={e => setPatientFormData({ ...patientFormData, egn: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Check type="checkbox" label="Health Insured?" checked={patientFormData.isHealthInsured} onChange={e => setPatientFormData({ ...patientFormData, isHealthInsured: e.target.checked })} className="text-dark fw-bold" />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Personal GP</Form.Label>
                                                            <Form.Select value={patientFormData.personalDoctorId} onChange={e => setPatientFormData({ ...patientFormData, personalDoctorId: e.target.value })} required>
                                                                <option value="">Select a GP...</option>
                                                                {doctors.filter(d => d.gp).map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                                                            </Form.Select>
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Username</Form.Label>
                                                            <Form.Control type="text" value={patientFormData.username} onChange={e => setPatientFormData({ ...patientFormData, username: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Email</Form.Label>
                                                            <Form.Control type="email" value={patientFormData.email} onChange={e => setPatientFormData({ ...patientFormData, email: e.target.value })} required />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="text-muted fw-bold small">Password</Form.Label>
                                                            <Form.Control type="password" value={patientFormData.password} onChange={e => setPatientFormData({ ...patientFormData, password: e.target.value })} required />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                                <Button variant="primary" type="submit" className="mt-3 px-4 fw-bold">Register Patient</Button>
                                            </Form>
                                        </Tab.Pane>
                                    </Tab.Content>
                                </Tab.Container>
                            </Card.Body>
                        </Card>
                    </Tab.Pane>

                    {/* --- ТАБ 3: СТАТИСТИКИ --- */}
                    <Tab.Pane eventKey="stats">
                        <Row className="g-4 mb-4">
                            <Col lg={4}>
                                <Card className="border-0 shadow-sm text-center bg-primary text-white h-100">
                                    <Card.Body className="d-flex flex-column justify-content-center p-4">
                                        <h6 className="text-uppercase fw-bold opacity-75 mb-3">Total Private Revenue</h6>
                                        <h2 className="display-5 fw-bold mb-0">{actualRevenue.toFixed(2)} BGN</h2>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={8}>
                                <Card className="border-0 shadow-sm h-100 border-top border-warning border-3">
                                    <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-uppercase text-muted fw-bold mb-3">Sick Leaves Reports</h6>
                                            <div className="mb-2">
                                                <span className="fw-bold text-dark">Top Month: </span>
                                                {topSickLeaveMonth ? <Badge bg="warning" text="dark" className="fs-6">{topSickLeaveMonth[0]} ({topSickLeaveMonth[1]} leaves)</Badge> : <span className="text-muted small">No data</span>}
                                            </div>
                                            <div>
                                                <span className="fw-bold text-dark">Top Issuer (Doctor): </span>
                                                {topSickLeaveDoctor ? <Badge bg="danger" className="fs-6">{topSickLeaveDoctor[0]} ({topSickLeaveDoctor[1]} leaves)</Badge> : <span className="text-muted small">No data</span>}
                                            </div>
                                        </div>
                                        <div className="opacity-25" style={{ fontSize: '4rem' }}>📁</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Row className="g-4">
                            <Col md={6}>
                                <Card className="border-0 shadow-sm border-top border-info border-3 h-100">
                                    <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between">
                                        <span>Patient Visits & Revenue per Doctor</span>
                                    </Card.Header>
                                    <Card.Body className="p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table hover className="mb-0 small">
                                            <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Doctor</th>
                                                <th className="text-center">Total Visits</th>
                                                <th className="text-end pe-4">Revenue Generated</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {Object.entries(stats.visitsPerDoctor).map(([docName, visits], idx) => (
                                                <tr key={idx}>
                                                    <td className="ps-4 fw-bold text-dark">{docName}</td>
                                                    <td className="text-center"><Badge bg="info" className="p-2">{visits as number}</Badge></td>
                                                    <td className="text-end pe-4 fw-bold text-success">
                                                        {revenuePerDoctor[docName] ? `${revenuePerDoctor[docName].toFixed(2)} BGN` : '0.00 BGN'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {Object.keys(stats.visitsPerDoctor).length === 0 && (
                                                <tr><td colSpan={3} className="text-center text-muted p-4">No visits recorded yet.</td></tr>
                                            )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={6}>
                                <Card className="border-0 shadow-sm border-top border-success border-3 h-100">
                                    <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between">
                                        <span>Patients per General Practitioner (GP)</span>
                                    </Card.Header>
                                    <Card.Body className="p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table hover className="mb-0 small">
                                            <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">GP Name</th>
                                                <th className="text-end pe-4">Registered Patients</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {Object.entries(patientsPerGp).map(([gpName, count], idx) => (
                                                <tr key={idx}>
                                                    <td className="ps-4 fw-bold text-dark">{gpName}</td>
                                                    <td className="text-end pe-4"><Badge bg="success" className="p-2">{count} Patients</Badge></td>
                                                </tr>
                                            ))}
                                            {Object.keys(patientsPerGp).length === 0 && (
                                                <tr><td colSpan={2} className="text-center text-muted p-4">No GPs registered.</td></tr>
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

export default AdminDashboard;