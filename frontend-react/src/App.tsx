import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'

const RoleBasedRedirect = () => {
    const { user, logout } = useAuth()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    const appRoles = user.roles
        .filter(role => role.startsWith('ROLE_'))
        .map(role => role.replace('ROLE_', ''))

    if (appRoles.includes('ADMIN')) {
        return <Navigate to="/admin" replace />
    }

    if (appRoles.includes('DOCTOR')) {
        return <Navigate to="/doctor" replace />
    }

    if (appRoles.includes('PATIENT')) {
        return <Navigate to="/patient" replace />
    }

    return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center">
            <h2 className="mb-4 text-muted">No specific role assigned to this account.</h2>
            <button className="btn btn-danger fw-bold" onClick={logout}>
                Logout
            </button>
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
                    <Route path="/dashboard" element={<RoleBasedRedirect />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/doctor" element={<DoctorDashboard />} />
                    <Route path="/patient" element={<PatientDashboard />} />
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App