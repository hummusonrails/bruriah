import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginForm } from './components/auth/login'
import { ChatInterface } from './components/chat-interface'
import { Profile } from './components/profile/profile'
import { AdminChatInterface } from './components/admin/admin'


export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={<ChatInterface />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<AdminChatInterface />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

