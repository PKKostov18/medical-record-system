import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Nav } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState<any[]>([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [doctorFormData, setDoctorFormData] = useState({
        name: '', uin: '', specialty: '', isGp: false, username: '', email: '', password: ''
    });

    const [patientFormData, setPatientFormData] = useState({
        name: '', egn: '', isHealthInsured: false, personalDoctorId: '', username: '', email: '', password: ''
    });

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:9000/api',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const loadDoctors = async () => {
        try {
            const response = await api.get('/doctors');
            setDoctors(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user && ['ADMIN', 'ROLE_ADMIN'].some(r => user.roles.includes(r))) {
            loadDoctors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    if (!user || (!['ADMIN', 'ROLE_ADMIN'].some(r => user.roles.includes(r)))) {
        return <Navigate to="/dashboard" />;
    }

    const handleDoctorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg(''); setErrorMsg('');
        try {
            const payload = { ...doctorFormData, gp: doctorFormData.isGp };
            await api.post('/doctors', payload);
            setSuccessMsg('Doctor registered successfully!');
            setDoctorFormData({ name: '', uin: '', specialty: '', isGp: false, username: '', email: '', password: '' });
            loadDoctors(); // Refresh doctors list
        } catch (err: any) {
            console.error("Doctor error details: ", err);
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to register doctor. Permission issue or user might already exist!');
        }
    };

    const handlePatientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg(''); setErrorMsg('');
        try {
            const payload = {
                ...patientFormData,
                healthInsured: patientFormData.isHealthInsured,
                personalDoctorId: patientFormData.personalDoctorId ? Number(patientFormData.personalDoctorId) : null
            };
            await api.post('/patients', payload);
            setSuccessMsg('Patient registered successfully!');
            setPatientFormData({ name: '', egn: '', isHealthInsured: false, personalDoctorId: '', username: '', email: '', password: '' });
        } catch (err: any) {
            console.error("Patient error details: ", err);
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to register patient. Permission issue or user might already exist!');
        }
    };

    return (
        <Container className="py-5">

            {/* --- НОВИЯТ ХЕДЪР --- */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>
                    Administration Portal
                </h2>
                <Button
                    variant="outline-danger"
                    className="fw-bold px-4"
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                >
                    Log Out
                </Button>
            </div>
            {/* --------------------- */}

            {successMsg && <Alert variant="success" className="fw-bold">{successMsg}</Alert>}
            {errorMsg && <Alert variant="danger" className="fw-bold">{errorMsg}</Alert>}

            <Card className="glass-panel border-0 mb-5">
                <Card.Body>
                    <Tab.Container defaultActiveKey="doctor">
                        <Nav variant="pills" className="mb-4">
                            <Nav.Item>
                                <Nav.Link eventKey="doctor" className="fw-bold px-4" style={{ cursor: 'pointer' }}>Add Doctor</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="patient" className="fw-bold px-4" style={{ cursor: 'pointer' }}>Add Patient</Nav.Link>
                            </Nav.Item>
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
                                    <Button variant="primary" type="submit" className="mt-3">Register Doctor</Button>
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
                                                    {doctors.filter(d => d.gp).map(d => (
                                                        <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                                                    ))}
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
                                    <Button variant="primary" type="submit" className="mt-3">Register Patient</Button>
                                </Form>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Card.Body>
            </Card>

        </Container>
    );
};

export default AdminDashboard;