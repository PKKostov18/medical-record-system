import { useState, useEffect } from 'react';
import { Container, Card, Badge, Alert, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';


interface PatientProfile {
    id: number;
    name: string;
    egn: string;
    healthInsured: boolean;
    personalDoctorName?: string;
}

interface Examination {
    id: number;
    doctor: { id: number; name: string };
    examinationDate: string;
    diagnosisName: string;
    prescribedTreatment: string;
    medicalNotes: string;
    price: number;
    paidByNzok: boolean;
    sickLeave?: { startDate: string; durationDays: number };
}

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [examinations, setExaminations] = useState<Examination[]>([]);

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    if (!user || !token) {
        return <Navigate to="/login" />;
    }

    const api = axios.create({
        baseURL: 'http://localhost:9000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        const fetchPatientData = async () => {
            setLoading(true);
            setErrorMsg('');
            let currentPatientId = null;

            // 1. ПЪРВО: Опитваме да изтеглим профила
            try {
                const profileRes = await api.get('/patients/me');
                setProfile(profileRes.data);
                currentPatientId = profileRes.data.id;
            } catch (error: any) {
                console.error("Profile Error:", error);
                setErrorMsg('Could not load patient profile. Please contact administration.');
                setLoading(false);
                return; // Спираме дотук, ако няма профил
            }

            // 2. ВТОРО: Опитваме да изтеглим прегледите (в отделен try-catch блок)
            if (currentPatientId) {
                try {
                    const examsRes = await api.get(`/examinations/patient/${currentPatientId}`);
                    if (Array.isArray(examsRes.data)) {
                        setExaminations(examsRes.data);
                    }
                } catch (error: any) {
                    console.error("Examinations Error:", error);
                    // Ако грешката е 404 (няма прегледи), не я показваме като фатална грешка.
                    if (error.response && error.response.status !== 404) {
                        setErrorMsg('Profile loaded, but could not load medical history.');
                    }
                }
            }

            setLoading(false);
        };

        fetchPatientData();
    }, []);

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading your medical record...</p>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>
                    Patient Portal
                </h2>
                <button
                    className="btn btn-outline-danger fw-bold px-4"
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                >
                    Log Out
                </button>
            </div>

            {errorMsg && <Alert variant="danger" className="fw-bold shadow-sm">{errorMsg}</Alert>}

            {profile && (
                <Card className="mb-4 shadow-sm border-0 border-top border-primary border-3">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col md={8}>
                                <h4 className="fw-bold text-primary mb-1">{profile.name}</h4>
                                <p className="text-muted mb-0"><strong>EGN:</strong> {profile.egn}</p>
                                {profile.personalDoctorName && (
                                    <p className="text-muted mb-0"><strong>GP:</strong> Dr. {profile.personalDoctorName}</p>
                                )}
                            </Col>
                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                <h6 className="mb-2 text-muted fw-bold">Insurance Status:</h6>
                                {profile.healthInsured ? (
                                    <Badge bg="success" className="p-2 fs-6">✅ Health Insured (NHIF)</Badge>
                                ) : (
                                    <Badge bg="danger" className="p-2 fs-6">❌ Not Insured</Badge>
                                )}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <h4 className="fw-bold text-muted mb-3">Medical History</h4>

            {examinations.length === 0 ? (
                <Alert variant="info" className="shadow-sm">
                    You have no past medical examinations in the system.
                </Alert>
            ) : (
                examinations.map(exam => (
                    <Card key={exam.id} className="mb-3 border-0 shadow-sm bg-light">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 className="fw-bold mb-0 text-primary">{exam.diagnosisName}</h5>
                                    <small className="text-muted fw-bold">
                                        {new Date(exam.examinationDate).toLocaleString('en-US', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </small>
                                </div>
                                <Badge bg={exam.paidByNzok ? 'success' : 'danger'} className="p-2">
                                    {exam.paidByNzok ? 'Covered by NHIF' : `Paid: ${exam.price.toFixed(2)} BGN`}
                                </Badge>
                            </div>

                            <Row>
                                <Col md={6}>
                                    <p className="mb-1"><strong>Doctor:</strong> Dr. {exam.doctor.name}</p>
                                    <p className="mb-1"><strong>Treatment:</strong> {exam.prescribedTreatment}</p>
                                    {exam.medicalNotes && (
                                        <p className="mb-1"><strong>Notes:</strong> {exam.medicalNotes}</p>
                                    )}
                                </Col>
                            </Row>

                            {exam.sickLeave && (
                                <Alert variant="warning" className="py-2 px-3 mt-3 mb-0 border-warning" style={{ backgroundColor: '#fff8e6' }}>
                                    <strong className="text-warning-emphasis">📅 Sick Leave Issued:</strong> {exam.sickLeave.durationDays} days starting from {new Date(exam.sickLeave.startDate).toLocaleDateString()}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                ))
            )}
        </Container>
    );
};

export default PatientDashboard;