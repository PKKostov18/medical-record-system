import { useState, useEffect } from 'react';
import { Container, Card, Badge, Alert, Row, Col, Spinner, Tab, Nav, Button } from 'react-bootstrap';
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
    const [doctors, setDoctors] = useState<any[]>([]);

    const [localPaidExams, setLocalPaidExams] = useState<Record<number, boolean>>(() => {
        const saved = localStorage.getItem('paid_examinations');
        return saved ? JSON.parse(saved) : {};
    });

    const [payingExamId, setPayingExamId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

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

            try {
                const profileRes = await api.get('/patients/me');
                setProfile(profileRes.data);
                currentPatientId = profileRes.data.id;
            } catch (error: any) {
                console.error("Profile Error:", error);
                setErrorMsg('Could not load patient profile. Please contact administration.');
                setLoading(false);
                return;
            }

            if (currentPatientId) {
                try {
                    const examsRes = await api.get(`/examinations/patient/${currentPatientId}`);
                    if (Array.isArray(examsRes.data)) {
                        setExaminations(examsRes.data);
                    }
                } catch (error: any) {
                    console.error("Examinations Error:", error);
                    if (error.response && error.response.status !== 404) {
                        setErrorMsg('Profile loaded, but could not load medical history.');
                    }
                }
            }

            try {
                const doctorsRes = await api.get('/doctors');
                if (Array.isArray(doctorsRes.data)) setDoctors(doctorsRes.data);
            } catch (error: any) {
                console.error("Could not load doctors directory", error);
            }

            setLoading(false);
        };

        fetchPatientData();
    }, []);

    const handleSimulatePayment = (examId: number) => {
        setPayingExamId(examId);

        setTimeout(() => {
            setLocalPaidExams(prev => {
                const updated = { ...prev, [examId]: true };
                localStorage.setItem('paid_examinations', JSON.stringify(updated));
                return updated;
            });
            setPayingExamId(null);
            setSuccessMsg('Payment processed successfully! Invoice cleared.');
            setTimeout(() => setSuccessMsg(''), 4000);
        }, 1500);
    };

    const getEndDate = (startDateStr: string, durationDays: number) => {
        const start = new Date(startDateStr);
        start.setDate(start.getDate() + durationDays);
        return start.toLocaleDateString();
    };

    const sickLeavesExams = examinations.filter(exam => exam.sickLeave);

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
            {successMsg && <Alert variant="success" className="fw-bold shadow-sm">{successMsg}</Alert>}

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

            <Tab.Container defaultActiveKey="history">
                <Nav variant="tabs" className="mb-4 border-bottom-0">
                    <Nav.Item>
                        <Nav.Link eventKey="history" className="fw-bold text-muted" style={{ cursor: 'pointer' }}>Medical History</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="sick-leaves" className="fw-bold text-warning" style={{ cursor: 'pointer' }}>📁 Sick Leaves</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="directory" className="fw-bold text-primary" style={{ cursor: 'pointer' }}>Doctors Directory</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    <Tab.Pane eventKey="history">
                        {examinations.length === 0 ? (
                            <Alert variant="info" className="shadow-sm">
                                You have no past medical examinations in the system.
                            </Alert>
                        ) : (
                            examinations.map(exam => {
                                const isLocallyPaid = localPaidExams[exam.id];

                                return (
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

                                                <div>
                                                    {exam.paidByNzok ? (
                                                        <Badge bg="success" className="p-2">Covered by NHIF</Badge>
                                                    ) : isLocallyPaid ? (
                                                        <Badge bg="success" className="p-2">✅ Paid by Patient ({exam.price.toFixed(2)} BGN)</Badge>
                                                    ) : (
                                                        <Badge bg="danger" className="p-2">⚠️ Unpaid: {exam.price.toFixed(2)} BGN</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <Row>
                                                <Col md={8}>
                                                    <p className="mb-1"><strong>Doctor:</strong> Dr. {exam.doctor.name}</p>
                                                    <p className="mb-1"><strong>Treatment:</strong> {exam.prescribedTreatment}</p>
                                                    {exam.medicalNotes && (
                                                        <p className="mb-1"><strong>Notes:</strong> {exam.medicalNotes}</p>
                                                    )}
                                                </Col>

                                                {!exam.paidByNzok && !isLocallyPaid && (
                                                    <Col md={4} className="text-md-end d-flex align-items-end justify-content-md-end mt-2 mt-md-0">
                                                        <Button
                                                            variant="warning"
                                                            size="sm"
                                                            className="fw-bold text-white shadow-sm"
                                                            disabled={payingExamId === exam.id}
                                                            onClick={() => handleSimulatePayment(exam.id)}
                                                        >
                                                            {payingExamId === exam.id ? (
                                                                <>
                                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                '💳 Pay Now'
                                                            )}
                                                        </Button>
                                                    </Col>
                                                )}
                                            </Row>

                                            {exam.sickLeave && (
                                                <Alert variant="warning" className="py-2 px-3 mt-3 mb-0 border-warning" style={{ backgroundColor: '#fff8e6' }}>
                                                    <strong className="text-warning-emphasis">📅 Sick Leave Issued:</strong> {exam.sickLeave.durationDays} days starting from {new Date(exam.sickLeave.startDate).toLocaleDateString()}
                                                </Alert>
                                            )}
                                        </Card.Body>
                                    </Card>
                                );
                            })
                        )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="sick-leaves">
                        {sickLeavesExams.length === 0 ? (
                            <Alert variant="info" className="shadow-sm">
                                You have no issued sick leaves in the system.
                            </Alert>
                        ) : (
                            sickLeavesExams.map(exam => (
                                <Card key={exam.id} className="mb-3 border-0 shadow-sm style-card" style={{ borderLeft: '5px solid #ffc107', backgroundColor: '#fffdf6' }}>
                                    <Card.Body>
                                        <Row className="align-items-center">
                                            <Col md={8}>
                                                <h5 className="fw-bold text-warning-emphasis mb-1">
                                                    Medical Sick Leave Certificate
                                                </h5>
                                                <p className="mb-2 text-muted small">Issued on the occasion of: <strong>{exam.diagnosisName}</strong></p>

                                                <Row className="mt-2 g-2">
                                                    <Col sm={6}>
                                                        <p className="mb-1 small"><strong>📅 Start Date:</strong> {new Date(exam.sickLeave!.startDate).toLocaleDateString()}</p>
                                                    </Col>
                                                    <Col sm={6}>
                                                        <p className="mb-1 small"><strong>⌛ End Date (Inclusive):</strong> {getEndDate(exam.sickLeave!.startDate, exam.sickLeave!.durationDays)}</p>
                                                    </Col>
                                                </Row>
                                                <p className="mb-0 mt-2 small"><strong>Attending Physician:</strong> Dr. {exam.doctor.name}</p>
                                            </Col>

                                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                                <div className="bg-warning text-white rounded p-3 d-inline-block text-center shadow-sm" style={{ minWidth: '120px' }}>
                                                    <h3 className="fw-bold mb-0">{exam.sickLeave!.durationDays}</h3>
                                                    <small className="fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Total Days</small>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="directory">
                        <Row>
                            {doctors.length === 0 ? (
                                <Alert variant="info" className="shadow-sm">
                                    No doctors found in the directory.
                                </Alert>
                            ) : (
                                doctors.map(doc => {
                                    const isMyGp = profile?.personalDoctorName === doc.name;
                                    return (
                                        <Col md={6} lg={4} key={doc.id} className="mb-3">
                                            <Card className={`border-0 shadow-sm h-100 ${isMyGp ? 'border-primary border-2' : ''}`}>
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <h5 className="fw-bold text-dark mb-1">Dr. {doc.name}</h5>
                                                        {isMyGp && <Badge bg="primary">Your GP</Badge>}
                                                    </div>
                                                    <p className="text-muted mb-2">{doc.specialty}</p>
                                                    <hr className="my-2" />
                                                    <p className="small mb-0"><strong>UIN:</strong> {doc.uin}</p>
                                                    <p className="small mb-0 text-muted">
                                                        {doc.isGp ? 'General Practitioner' : 'Specialist'}
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })
                            )}
                        </Row>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Container>
    );
};

export default PatientDashboard;