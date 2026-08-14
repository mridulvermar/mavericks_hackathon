import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'worker' })

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem('sh_token', 'demo-token')
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌟</div>
          <h1 className="text-3xl font-extrabold text-foreground">Join SilverHands</h1>
          <p className="text-muted mt-1">Create your free account today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-base font-semibold text-foreground mb-2">
                👤 Full Name
              </label>
              <input
                id="name"
                type="text"
                className="input text-lg"
                placeholder="Your full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-base font-semibold text-foreground mb-2">
                📱 Mobile Number
              </label>
              <input
                id="reg-phone"
                type="tel"
                className="input text-lg"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-base font-semibold text-foreground mb-2">
                🔒 Create Password
              </label>
              <input
                id="reg-password"
                type="password"
                className="input text-lg"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-foreground mb-2">
                🎯 I want to...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'worker', label: '💼 Find Work', desc: 'Offer my skills' },
                  { value: 'client', label: '🔍 Hire Help', desc: 'Find skilled people' },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${form.role === r.value
                        ? 'border-primary bg-primary-50 text-primary'
                        : 'border-border text-muted hover:border-primary-200'
                      }`}
                    aria-pressed={form.role === r.value}
                    id={`role-${r.value}`}
                  >
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-sm">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full text-lg py-4" id="btn-register">
              <UserPlus size={22} /> Create My Account
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-primary font-semibold hover:underline text-base">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
