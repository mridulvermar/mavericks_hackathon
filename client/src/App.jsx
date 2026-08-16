import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'

// ── Pages ──
import Landing               from './pages/Landing'
import Login                 from './pages/Login'
import Register              from './pages/Register'
import Onboarding            from './pages/Onboarding'
import Dashboard             from './pages/Dashboard'
import MyProfile             from './pages/MyProfile'
import AISkillDiscovery      from './pages/AISkillDiscovery'
import Opportunities         from './pages/Opportunities'
import OpportunityDetail     from './pages/OpportunityDetail'
import Marketplace           from './pages/Marketplace'
import ProductDetail         from './pages/ProductDetail'
import Bookings              from './pages/Bookings'
import Chat                  from './pages/Chat'
import Earnings              from './pages/Earnings'
import AIAssistant           from './pages/AIAssistant'
import Settings              from './pages/Settings'
import PostJob               from './pages/PostJob'
import MyPostings            from './pages/MyPostings'
import PostingApplications   from './pages/PostingApplications'
import NotFound              from './pages/NotFound'

// ── Auth Guard ──
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('sh_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Onboarding — no nav shell */}
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />

        {/* Protected routes inside AppShell (with nav) */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/home"                                  element={<Dashboard />} />
          <Route path="/profile"                               element={<MyProfile />} />
          <Route path="/skills"                                element={<AISkillDiscovery />} />
          <Route path="/opportunities"                         element={<Opportunities />} />
          <Route path="/opportunities/:id"                     element={<OpportunityDetail />} />
          <Route path="/marketplace"                           element={<Marketplace />} />
          <Route path="/marketplace/:id"                       element={<ProductDetail />} />
          <Route path="/bookings"                              element={<Bookings />} />
          <Route path="/chat"                                  element={<Chat />} />
          <Route path="/chat/:id"                              element={<Chat />} />
          <Route path="/earnings"                              element={<Earnings />} />
          <Route path="/assistant"                             element={<AIAssistant />} />
          <Route path="/settings"                              element={<Settings />} />
          <Route path="/post-job"                              element={<PostJob />} />
          <Route path="/my-postings"                           element={<MyPostings />} />
          <Route path="/my-postings/:id/applications"          element={<PostingApplications />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
