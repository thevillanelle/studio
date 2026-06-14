import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/useAuthStore'
import UserNav from './components/layout/UserNav'

import Welcome      from './pages/Welcome'
import Dashboard    from './pages/Dashboard'
import Projects     from './pages/Projects'
import Circle       from './pages/Circle'
import Skills       from './pages/Skills'
import Goals        from './pages/Goals'
import Discover     from './pages/Discover'
import AuthCallback from './pages/AuthCallback'
import Fire         from './pages/Fire'

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [])

  return (
    <BrowserRouter>
      <UserNav />
      <Routes>
        <Route path="/"              element={<Welcome />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/projects"      element={<Projects />} />
        <Route path="/circle"        element={<Circle />} />
        <Route path="/skills"        element={<Skills />} />
        <Route path="/goals"         element={<Goals />} />
        <Route path="/discover"      element={<Discover />} />
        <Route path="/fire"          element={<Fire />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
