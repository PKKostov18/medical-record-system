import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard';

// Този компонент заменя стария DummyDashboard и служи само като "разпределител"
const RoleBasedRedirect = () => {
    const { user, logout } = useAuth()

    // Ако няма логнат потребител, връщаме към login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Извличаме ролите (ADMIN, DOCTOR и т.н.)
    const appRoles = user.roles
        .filter(role => role.startsWith('ROLE_'))
        .map(role => role.replace('ROLE_', ''))

    // Автоматично пренасочване според ролята
    if (appRoles.includes('ADMIN')) {
        return <Navigate to="/admin" replace />
    }

    if (appRoles.includes('DOCTOR')) {
        return <Navigate to="/doctor" replace />
    }

    // Място за бъдещ панел за пациенти:
    // if (appRoles.includes('PATIENT')) {
    //   return <Navigate to="/patient" replace />
    // }

    // Fallback: Ако потребителят няма разпозната роля
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
                    {/* Когато логинът успее, той праща към /dashboard, който вече автоматично разпределя */}
                    <Route path="/dashboard" element={<RoleBasedRedirect />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/doctor" element={<DoctorDashboard />}/>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App