import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'

// Guards a route — redirects to /login if no token in localStorage
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/upload"    element={<PrivateRoute><Upload /></PrivateRoute>} />
        {/* Catch-all: redirect unknown paths to login */}
        <Route path="*"          element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
