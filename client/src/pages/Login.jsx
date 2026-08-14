import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ phone: '', password: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Demo: skip auth and go to home
    localStorage.setItem('sh_token', 'demo-token')
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤲</div>
          <h1 className="text-3xl font-extrabold text-foreground">Welcome Back</h1>
          <p className="text-muted mt-1">Sign in to your SilverHands account</p>
        </div>

        <div className="card p-8">
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

            <button type="submit" className="btn-primary w-full text-lg py-4" id="btn-login">
              <LogIn size={22} /> Sign In
            </button>
          </form>

          <div className="mt-5 text-center space-y-3">
            <Link to="/register" className="block text-primary font-semibold hover:underline text-base">
              New to SilverHands? Register here →
            </Link>
            <p className="text-muted text-sm">
              Demo mode: tap Sign In to enter without credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
