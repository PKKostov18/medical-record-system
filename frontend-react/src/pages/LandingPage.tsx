import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex flex-column position-relative">
      {/* Abstract glowing orb top-right */}
      <div className="position-absolute top-0 end-0" style={{ width: '40rem', height: '40rem', background: 'radial-gradient(circle, rgba(0,120,212,0.08) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>

      {/* Global Glass Navbar */}
      <header className="py-3 sticky-top" style={{ background: 'var(--surface-glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--surface-border)' }}>
        <Container className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #0078d4, #0096c7)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <h3 className="m-0 fw-bold text-dark" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '1.2rem' }}>
              MediCare<span style={{ color: 'var(--accent)' }}>//Pro</span>
            </h3>
          </div>
          <Button variant="primary" className="px-4" onClick={() => navigate('/login')}>
            System Login
          </Button>
        </Container>
      </header>

      {/* Hero Section */}
      <Container className="flex-grow-1 d-flex flex-column justify-content-center py-5 position-relative" style={{ zIndex: 1 }}>
        <Row className="align-items-center g-5 mb-5 pb-5">
          <Col lg={7}>
            <div className="d-inline-block mb-4 px-3 py-1 glass-panel" style={{ borderRadius: '20px' }}>
              <span className="text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--accent)' }}>●</span> Secure Data Protocol Offline
              </span>
            </div>
            <h1 className="display-3 fw-bold mb-4 lh-sm text-dark">
              Next-Gen Medical <br />
              <span className="text-gradient">Intelligence Hub.</span>
            </h1>
            <p className="mb-5 text-muted" style={{ fontSize: '1.2rem', lineHeight: '1.7', maxWidth: '90%', fontWeight: '500' }}>
              A high-precision, hyper-secure telemetry and record platform. Instantly sync patient vitals, diagnostic histories, and treatment protocols across a strictly encrypted neural network.
            </p>
            <div className="d-flex gap-4">
              <Button variant="primary" size="lg" className="px-5 py-3" onClick={() => navigate('/login')}>
                Initialize Access //
              </Button>
            </div>
          </Col>
          
          <Col lg={5} className="d-none d-lg-block position-relative">
            {/* Tech UI abstract mockup */}
            <div className="glass-panel p-4 position-relative" style={{ height: '400px', width: '100%', overflow: 'hidden' }}>
              
              <div className="d-flex justify-content-between border-bottom pb-3 mb-4" style={{ borderColor: 'var(--surface-border)' }}>
                <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>System Status</span>
                <span className="text-success text-uppercase fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>● Online</span>
              </div>
              
              <Row className="g-3 mb-4">
                <Col xs={6}>
                  <div className="p-3" style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '0.7rem' }}>Global Records</div>
                    <div className="fs-3 fw-bold text-gradient">24,592</div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="p-3" style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '0.7rem' }}>Encryption Level</div>
                    <div className="fs-3 fw-bold text-dark">AES-256</div>
                  </div>
                </Col>
              </Row>
              
              {/* Fake Data Lines */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="d-flex align-items-center gap-3 mb-3 p-2" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '4px' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.1)', flexGrow: 1, borderRadius: '3px' }}></div>
                  <div style={{ width: '40px', height: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px' }}></div>
                </div>
              ))}
            </div>
          </Col>
        </Row>

        {/* Features Section */}
        <Row className="g-4 mb-5 pb-4">
          <Col md={4}>
            <div className="h-100 glass-panel p-5 text-start d-flex flex-column justify-content-between group">
              <div>
                <div className="mb-4" style={{ color: 'var(--accent)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <h4 className="fw-bold mb-3 text-uppercase text-dark" style={{ letterSpacing: '1px' }}>Physician Node</h4>
                <p className="text-muted fw-bold" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                  A dedicated portal for medical professionals to upload sensory data, log diagnostic results, and track treatment telemetry with zero latency.
                </p>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="h-100 glass-panel p-5 text-start d-flex flex-column justify-content-between position-relative overflow-hidden group border-primary" style={{ border: '1px solid rgba(0, 120, 212, 0.3)' }}>
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'radial-gradient(circle at bottom right, rgba(0, 120, 212, 0.05), transparent 60%)', zIndex: 0 }}></div>
              <div className="position-relative" style={{ zIndex: 1 }}>
                <div className="mb-4 text-primary">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <h4 className="fw-bold mb-3 text-uppercase text-dark" style={{ letterSpacing: '1px' }}>Patient Uplink</h4>
                <p className="text-muted fw-bold" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                  End-users receive a private, heavily encrypted dashboard to monitor medical statuses and review historical data logs entirely securely.
                </p>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="h-100 glass-panel p-5 text-start d-flex flex-column justify-content-between group">
              <div>
                <div className="mb-4" style={{ color: 'var(--accent)' }}>
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                </div>
                <h4 className="fw-bold mb-3 text-uppercase text-dark" style={{ letterSpacing: '1px' }}>Command Center</h4>
                <p className="text-muted fw-bold" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                  Root-level administrative access. Aggregate server-wide statistical arrays, govern authorizations, and enforce system compliance policies.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LandingPage;
