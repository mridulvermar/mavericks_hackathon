import React, { useState } from 'react'
import { Bell, Globe, Lock, User, ChevronRight, LogOut, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const languages = ['English', 'हिंदी (Hindi)', 'मराठी (Marathi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)']

export default function Settings() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState({ jobs: true, messages: true, payments: true, updates: false })
  const [language, setLanguage] = useState('English')
  const [fontSize, setFontSize] = useState('Large')

  const toggle = (key) => setNotifications(n => ({ ...n, [key]: !n[key] }))

  const handleLogout = () => {
    localStorage.removeItem('sh_token')
    navigate('/')
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">⚙️ Settings</h1>

      {/* Profile */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2"><User size={20} className="text-primary" /> My Account</h2>
        {[
          { label: 'Edit Profile', to: '/profile' },
          { label: 'Change Password', to: null },
          { label: 'Verify Identity', to: null },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => item.to ? navigate(item.to) : alert('Coming soon!')}
            className="w-full flex items-center justify-between py-3.5 border-b border-border last:border-0 hover:text-primary transition-colors min-h-touch"
            id={`setting-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="text-base text-foreground">{item.label}</span>
            <ChevronRight size={20} className="text-muted" />
          </button>
        ))}
      </div>

      {/* Language */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2"><Globe size={20} className="text-primary" /> Language</h2>
        <div className="flex flex-wrap gap-2">
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all min-h-touch
                ${language === lang ? 'border-primary bg-primary-100 text-primary' : 'border-border text-foreground'}`}
              id={`lang-${lang.split(' ')[0].toLowerCase()}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">🔡 Text Size</h2>
        <div className="flex gap-2">
          {['Normal', 'Large', 'Extra Large'].map(size => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all min-h-touch
                ${fontSize === size ? 'border-primary bg-primary-100 text-primary' : 'border-border text-foreground'}`}
              id={`font-${size.toLowerCase().replace(' ', '-')}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2"><Bell size={20} className="text-primary" /> Notifications</h2>
        <div className="space-y-4">
          {[
            { key: 'jobs', label: 'New Job Opportunities', desc: 'Get notified when jobs matching your skills are posted' },
            { key: 'messages', label: 'New Messages', desc: 'Alerts for new chat messages' },
            { key: 'payments', label: 'Payment Updates', desc: 'Booking confirmations and payment alerts' },
            { key: 'updates', label: 'App Updates', desc: 'New features and announcements' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-foreground text-base">{item.label}</p>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
              {/* Toggle switch */}
              <button
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => toggle(item.key)}
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

      {/* Privacy */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2"><Lock size={20} className="text-primary" /> Privacy & Safety</h2>
        {[
          { label: 'Privacy Policy' },
          { label: 'Terms of Service' },
          { label: 'Delete Account' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => alert(`${item.label} — coming soon!`)}
            className={`w-full flex items-center justify-between py-3.5 border-b border-border last:border-0 hover:text-primary transition-colors min-h-touch
              ${item.label === 'Delete Account' ? 'text-error' : 'text-foreground'}`}
            id={`setting-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="text-base">{item.label}</span>
            <ChevronRight size={20} className="text-muted" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full btn-secondary border-error text-error hover:bg-red-50 text-lg py-4"
        id="btn-logout"
      >
        <LogOut size={22} /> Sign Out
      </button>

      <p className="text-center text-muted text-sm pb-4">SilverHands v0.1.0 — Made with ❤️ for India</p>
    </div>
  )
}
