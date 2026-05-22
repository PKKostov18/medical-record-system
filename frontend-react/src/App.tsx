import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'

const DummyDashboard = () => {
  const { user, logout } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <div className="min-vh-100 p-5 d-flex flex-column align-items-center position-relative">
      <div className="position-absolute top-50 start-50 translate-middle" style={{ width: '40rem', height: '40rem', background: 'radial-gradient(circle, rgba(0,120,212,0.1) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div className="glass-panel p-5 w-100 position-relative" style={{ maxWidth: '800px', zIndex: 1 }}>
        <h1 className="fw-bold mb-4 text-gradient text-uppercase" style={{ letterSpacing: '1px' }}>Global Uplink Active</h1>
        
        <div className="mb-5 p-4 rounded-3" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid var(--surface-border)' }}>
          <div className="d-flex justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: 'var(--surface-border)' }}>
             <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '2px' }}>Authentication Detail</span>
             <span className="text-success text-uppercase fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '2px' }}>● Secure</span>
          </div>
          <p className="fs-5 mb-2">
             <strong className="text-uppercase text-muted me-3 fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Active User</strong> 
             <span className="text-dark fw-bold">{user.username}</span>
          </p>
          <p className="fs-5 m-0">
             <strong className="text-uppercase text-muted me-3 fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Privilege Node(s)</strong> 
             <span style={{ color: 'var(--accent)' }} className="fw-bold">[{user.roles.join(', ')}]</span>
          </p>
        </div>

        <button className="btn btn-primary fw-bold" onClick={logout} style={{ background: 'transparent', border: '1px solid #ff4757 !important', color: '#ff4757', boxShadow: 'none' }}>
           Terminate Session
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DummyDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
