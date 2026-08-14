import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, AlertCircle, ArrowRight } from 'lucide-react'
import authAPI from '../api/auth'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    persona: 'senior_citizen', // 'senior_citizen' | 'homemaker' | 'customer'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Please enter your full name.')
    if (!form.phone.trim()) return setError('Please enter your mobile number.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      let role = 'provider'
      let providerType = 'senior_citizen'
      if (form.persona === 'homemaker') {
        role = 'provider'
        providerType = 'homemaker'
      } else if (form.persona === 'customer') {
        role = 'customer'
        providerType = 'none'
      }

      const res = await authAPI.register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role,
        providerType,
      })

      if (res.success) {
        localStorage.setItem('sh_token', res.token)
        localStorage.setItem('sh_user', JSON.stringify(res.user))
        navigate('/onboarding')
      } else {
        setError(res.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to connect to server.'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🤲</div>
          <h1 className="text-3xl font-extrabold text-foreground">Join SilverHands</h1>
          <p className="text-muted mt-1 text-base">Create your free account & start earning or hiring</p>
        </div>

        <div className="card p-8 shadow-float">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="block text-base font-semibold text-foreground mb-2">
                👤 Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                className="input text-lg"
                placeholder="Enter your full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
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
                required
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-base font-semibold text-foreground mb-2">
                🔒 Password
              </label>
              <input
                id="reg-password"
                type="password"
                className="input text-lg"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-foreground mb-2">
                🎯 Who are you registering as?
              </label>
              <div className="space-y-2">
                {[
                  { id: 'senior_citizen', title: '👴 Senior Citizen', desc: 'Share wisdom & earn' },
                  { id: 'homemaker', title: '👩 Homemaker', desc: 'Monetize domestic skills' },
                  { id: 'customer', title: '🔍 Customer / Client', desc: 'Hire skilled help & services' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, persona: item.id }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all min-h-touch flex items-center justify-between
                      ${form.persona === item.id
                        ? 'border-primary bg-primary-50 text-primary font-semibold'
                        : 'border-border text-foreground hover:border-primary-300'
                      }`}
                  >
                    <div>
                      <div className="text-base font-bold">{item.title}</div>
                      <div className="text-xs text-muted font-normal">{item.desc}</div>
                    </div>
                    {form.persona === item.id && <span className="text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4 mt-2"
              id="btn-register-submit"
            >
              {loading ? (
                '⏳ Creating Account...'
              ) : (
                <>
                  <UserPlus size={22} /> Continue to Onboarding <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary font-semibold hover:underline text-base">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
