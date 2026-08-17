import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import authAPI from '../api/auth'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.phone.trim()) return setError('Please enter your mobile number.')
    if (!form.password) return setError('Please enter your password.')

    setLoading(true)
    try {
      const res = await authAPI.login({
        phone: form.phone.trim(),
        password: form.password,
      })

      if (res.success) {
        localStorage.setItem('sh_token', res.token)
        localStorage.setItem('sh_user', JSON.stringify(res.user))

        if (res.user && !res.user.onboardingComplete) {
          navigate('/onboarding')
        } else {
          navigate('/home')
        }
      } else {
        setError(res.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to connect to server.'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Career 2.0 Logo"
            className="w-20 h-20 rounded-2xl shadow-lg border-2 border-primary-200 object-cover mx-auto mb-3"
          />
          <h1 className="text-3xl font-extrabold text-foreground">Welcome Back</h1>
          <p className="text-muted mt-1 text-base">Sign in to your Career 2.0 account</p>
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
              <label htmlFor="phone" className="block text-base font-semibold text-foreground mb-2">
                📱 Mobile Number
              </label>
              <input
                id="phone"
                type="tel"
                className="input text-lg"
                placeholder="Enter your mobile number"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                autoComplete="tel"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold text-foreground mb-2">
                🔒 Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input text-lg pr-14"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4"
              id="btn-login-submit"
            >
              {loading ? '⏳ Signing In...' : <><LogIn size={22} /> Sign In</>}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link to="/register" className="block text-primary font-semibold hover:underline text-base">
              New to Career 2.0? Register here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
