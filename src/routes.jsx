import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginForm } from './components/auth/login'
import { ChatInterface } from './components/chat-interface'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={<ChatInterface />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

