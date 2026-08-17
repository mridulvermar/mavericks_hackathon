import React, { useState, useEffect } from 'react'
import { Bell, Globe, LogOut, ShieldCheck, CheckCircle2, AlertCircle, Trash2, FileText, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axios'

const languagesList = ['English', 'தமிழ் (Tamil)', 'हिंदी (Hindi)', 'मराठी (Marathi)', 'తెలుగు (Telugu)']

export default function Settings() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('sh_user') || '{}'))

  // 1. Language Preference
  const [selectedLang, setSelectedLang] = useState(currentUser.preferredLanguage || 'English')
  const [langMsg, setLangMsg] = useState(null)

  // 2. Text Size (Persisted in localStorage & applied to <html> element)
  const [textSize, setTextSize] = useState(() => localStorage.getItem('sh_text_size') || 'Normal')

  // 3. Notifications Preferences
  const [notifications, setNotifications] = useState(currentUser.notificationPreferences || { jobs: true, messages: true, payments: true, updates: false })
  const [notifMsg, setNotifMsg] = useState(null)

  // 4. Delete Account Confirmation Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // 5. Admin Reports (for Admin Role)
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)

  // Sync user state from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me')
        if (res.data.success && res.data.user) {
          const u = res.data.user
          setCurrentUser(u)
          localStorage.setItem('sh_user', JSON.stringify(u))
          setSelectedLang(u.preferredLanguage || 'English')
          if (u.notificationPreferences) setNotifications(u.notificationPreferences)
        }
      } catch (err) {
        // Fallback to local user
      }
    }
    fetchUser()
  }, [])

  // Apply Font Size App-Wide
  useEffect(() => {
    localStorage.setItem('sh_text_size', textSize)
    const root = document.documentElement
    root.classList.remove('text-size-small', 'text-size-normal', 'text-size-large', 'text-size-xlarge')
    if (textSize === 'Small') root.classList.add('text-size-small')
    else if (textSize === 'Large') root.classList.add('text-size-large')
    else if (textSize === 'Extra Large') root.classList.add('text-size-xlarge')
    else root.classList.add('text-size-normal')
  }, [textSize])

  // Load Admin Reports if role is Admin
  useEffect(() => {
    if (currentUser.role === 'admin') {
      const fetchReports = async () => {
        setLoadingReports(true)
        try {
          const res = await api.get('/reports')
          if (res.data.success) setReports(res.data.data || [])
        } catch (err) {
          // ignore
        } finally {
          setLoadingReports(false)
        }
      }
      fetchReports()
    }
  }, [currentUser.role])

  // Handler: Role Switch (Provider vs Job Provider)
  const handleRoleChange = (newRole) => {
    const updated = { ...currentUser, role: newRole }
    setCurrentUser(updated)
    localStorage.setItem('sh_user', JSON.stringify(updated))
    window.location.reload()
  }

  // Handler: Language Selection
  const handleSelectLanguage = async (lang) => {
    setSelectedLang(lang)
    try {
      const res = await api.patch('/users/me', { preferredLanguage: lang })
      if (res.data.success) {
        const u = { ...currentUser, preferredLanguage: lang }
        setCurrentUser(u)
        localStorage.setItem('sh_user', JSON.stringify(u))
        setLangMsg(`Language set to ${lang}.`)
        setTimeout(() => setLangMsg(null), 3000)
      }
    } catch (err) {
      // fallback local
    }
  }

  // Handler: Notifications Toggle
  const handleToggleNotif = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    try {
      const res = await api.patch('/users/me', { notificationPreferences: updated })
      if (res.data.success) {
        setNotifMsg('Notification preferences updated.')
        setTimeout(() => setNotifMsg(null), 2500)
      }
    } catch (err) {
      // fallback
    }
  }

  // Handler: Delete Account
  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await api.delete('/users/me')
      if (res.data.success) {
        localStorage.removeItem('sh_token')
        localStorage.removeItem('sh_user')
        alert('Your account has been deleted successfully.')
        navigate('/', { replace: true })
      } else {
        setDeleteError('Failed to delete account.')
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Error deleting account.')
    } finally {
      setDeleting(false)
    }
  }

  // Handler Admin: Resolve Report
  const handleResolveReport = async (reportId) => {
    try {
      const res = await api.patch(`/reports/${reportId}/resolve`)
      if (res.data.success) {
        setReports(prev => prev.map(r => r._id === reportId || r.id === reportId ? { ...r, status: 'resolved' } : r))
      }
    } catch (err) {
      alert('Failed to resolve report.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('sh_token')
    localStorage.removeItem('sh_user')
    navigate('/')
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">⚙️ Settings</h1>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 size={28} />
              <h3 className="font-extrabold text-xl">Delete Account?</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Are you sure you want to delete your account? This will deactivate your profile and remove your access. This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">{deleteError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-secondary flex-1 py-3 font-bold"
                id="btn-cancel-delete"
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="btn-primary flex-1 py-3 font-bold bg-red-600 hover:bg-red-700 border-red-600 text-white"
                id="btn-confirm-delete"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Switcher */}
      <div className="card bg-gradient-to-r from-primary-50 to-emerald-50 border-2 border-primary-200">
        <h2 className="font-extrabold text-lg text-foreground mb-1 flex items-center gap-2">
          🔄 Active Mode Switcher
        </h2>
        <p className="text-xs text-muted mb-3">Switch between Provider and Job Provider modes for live testing</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRoleChange('provider')}
            className={`p-3 rounded-xl border-2 text-center font-bold text-sm transition-all ${
              currentUser.role === 'provider' ? 'border-primary bg-primary text-white shadow-xs' : 'border-border bg-white text-foreground'
            }`}
            id="btn-switch-provider"
          >
            👵 Provider View
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('job_provider')}
            className={`p-3 rounded-xl border-2 text-center font-bold text-sm transition-all ${
              currentUser.role === 'job_provider' ? 'border-primary bg-primary text-white shadow-xs' : 'border-border bg-white text-foreground'
            }`}
            id="btn-switch-job-provider"
          >
            👤 Job Provider View
          </button>
        </div>
      </div>

      {/* Language Preference */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
          <Globe size={20} className="text-primary" /> Preferred Language
        </h2>
        {langMsg && <p className="text-xs font-bold text-emerald-600 mb-2">{langMsg}</p>}
        <div className="flex flex-wrap gap-2">
          {languagesList.map(lang => (
            <button
              key={lang}
              onClick={() => handleSelectLanguage(lang)}
              className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all min-h-touch
                ${selectedLang === lang ? 'border-primary bg-primary-100 text-primary font-bold' : 'border-border text-foreground'}`}
              id={`lang-${lang.split(' ')[0].toLowerCase()}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Text Size (App-Wide Scaling) */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
          🔡 App Text Size (Senior-Friendly Accessibility)
        </h2>
        <div className="flex gap-2">
          {['Normal', 'Large', 'Extra Large'].map(size => (
            <button
              key={size}
              onClick={() => setTextSize(size)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all min-h-touch
                ${textSize === size ? 'border-primary bg-primary-100 text-primary' : 'border-border text-foreground'}`}
              id={`font-${size.toLowerCase().replace(' ', '-')}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Preferences */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
          <Bell size={20} className="text-primary" /> Notification Preferences
        </h2>
        {notifMsg && <p className="text-xs font-bold text-emerald-600 mb-2">{notifMsg}</p>}
        <div className="space-y-4">
          {[
            { key: 'jobs', label: 'Opportunity & Application Updates', desc: 'Get notified when new applications arrive or statuses change' },
            { key: 'messages', label: 'New Message Alerts', desc: 'Real-time alerts for incoming chat messages' },
            { key: 'payments', label: 'Payment Updates', desc: 'Confirmations when bookings are completed or paid' },
            { key: 'updates', label: 'Platform Announcements', desc: 'Important community updates and safety tips' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-foreground text-base">{item.label}</p>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => handleToggleNotif(item.key)}
                className={`w-14 h-7 rounded-full transition-colors duration-200 flex items-center px-1 flex-shrink-0
                  ${notifications[item.key] ? 'bg-primary' : 'bg-gray-300'}`}
                id={`notif-${item.key}`}
              >
                <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${notifications[item.key] ? 'translate-x-7' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Safety Reports Panel (Visible for Admin role) */}
      {currentUser.role === 'admin' && (
        <div className="card border-2 border-amber-300 bg-amber-50/50 space-y-4">
          <h2 className="font-extrabold text-lg text-amber-900 flex items-center gap-2">
            <FileText size={22} className="text-amber-600" /> Admin Safety Reports Dashboard
          </h2>
          {loadingReports ? (
            <p className="text-sm text-muted">Loading safety reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted">No open safety reports found.</p>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => (
                <div key={rep._id || rep.id} className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-foreground">{rep.reason}</h4>
                      <p className="text-xs text-muted">
                        Reported by: <strong>{rep.reporterName}</strong> | Against: <strong>{rep.reportedUserName}</strong>
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      rep.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rep.status === 'resolved' ? 'Resolved ✅' : 'Open ⏳'}
                    </span>
                  </div>
                  {rep.message && <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{rep.message}</p>}
                  {rep.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveReport(rep._id || rep.id)}
                      className="btn-primary py-1.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check size={14} /> Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleLogout}
          className="w-full btn-secondary text-foreground hover:bg-gray-100 text-base py-3.5 font-bold"
          id="btn-logout"
        >
          <LogOut size={20} /> Sign Out
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full btn-secondary border-red-200 text-red-600 hover:bg-red-50 text-base py-3.5 font-bold flex items-center justify-center gap-2"
          id="btn-delete-account-trigger"
        >
          <Trash2 size={20} /> Delete Account
        </button>
      </div>

      <p className="text-center text-muted text-sm pb-4">Career 2.0 v0.1.0 — Empowering Senior Citizens & Homemakers</p>
    </div>
  )
}
