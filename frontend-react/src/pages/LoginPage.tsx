import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('client_id', 'medical-frontend');
      params.append('grant_type', 'password');
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post(
        'http://localhost:8080/realms/medical-realm/protocol/openid-connect/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      login(response.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Access Denied: Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center position-relative">
      <div className="position-absolute top-50 start-50 translate-middle" style={{ width: '30rem', height: '30rem', background: 'radial-gradient(circle, rgba(0,120,212,0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div className="text-center mb-4 position-relative" style={{ zIndex: 1 }}>
        <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0078d4, #0096c7)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h2 className="m-0 text-dark fw-bold text-uppercase" style={{ letterSpacing: '2px' }}>
            MediCare<span style={{ color: 'var(--accent)' }}>//Pro</span>
          </h2>
        </div>
        <p className="text-muted fs-6 text-uppercase fw-bold" style={{ letterSpacing: '2px' }}>Authentication Portal</p>
      </div>

      <div className="glass-panel p-5 position-relative" style={{ width: '100%', maxWidth: '420px', zIndex: 1 }}>
        {/* Decorative corner brackets */}
        <div style={{ position:'absolute', top:'10px', left:'10px', width:'15px', height:'15px', borderTop:'2px solid var(--accent)', borderLeft:'2px solid var(--accent)' }}></div>
        <div style={{ position:'absolute', top:'10px', right:'10px', width:'15px', height:'15px', borderTop:'2px solid var(--accent)', borderRight:'2px solid var(--accent)' }}></div>
        <div style={{ position:'absolute', bottom:'10px', left:'10px', width:'15px', height:'15px', borderBottom:'2px solid var(--accent)', borderLeft:'2px solid var(--accent)' }}></div>
        <div style={{ position:'absolute', bottom:'10px', right:'10px', width:'15px', height:'15px', borderBottom:'2px solid var(--accent)', borderRight:'2px solid var(--accent)' }}></div>

        {error && <Alert variant="danger" className="rounded-0 border border-danger bg-white text-danger text-uppercase fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>{error}</Alert>}

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-4" controlId="username">
            <Form.Label className="form-label text-muted fw-bold">Network ID [Username]</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Access ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-control py-3"
            />
          </Form.Group>

          <Form.Group className="mb-5" controlId="password">
            <Form.Label className="form-label text-muted fw-bold">Security Key [Password]</Form.Label>
            <Form.Control
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control py-3"
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 py-3 mb-4" disabled={loading}>
            {loading ? 'Authenticating...' : 'Establish Connection'}
          </Button>
          
          <div className="text-center">
             <Button variant="link" onClick={() => navigate('/')} className="text-decoration-none text-muted p-0 text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
              &lt; Abort Sequence
             </Button>
          </div>
        </Form>
      </div>
      
      <div className="mt-5 text-muted text-uppercase fw-bold position-relative" style={{ fontSize: '0.65rem', letterSpacing: '3px', zIndex: 1 }}>
        System Kernel v9.42 | <span style={{ color: 'var(--accent)' }}>Encrypted Channel</span>
      </div>
    </div>
  );
};

export default LoginPage;
