import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-background flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center gap-8">
        <div className="text-6xl mb-2" aria-hidden="true">🤲</div>
        <h1 className="text-4xl font-extrabold text-foreground max-w-lg leading-tight">
          Earn with Your<br />
          <span className="text-primary">Wisdom & Skills</span>
        </h1>
        <p className="text-lg text-muted max-w-sm leading-relaxed">
          SilverHands connects senior citizens and homemakers with meaningful work — on your own time, from home.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button
            className="btn-primary flex-1 text-lg py-4"
            onClick={() => navigate('/register')}
            id="cta-register"
          >
            Get Started — Free
          </button>
          <button
            className="btn-secondary flex-1 text-lg py-4"
            onClick={() => navigate('/login')}
            id="cta-login"
          >
            Sign In
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {['🔒 Safe & Secure', '🇮🇳 Made for India', '🤖 AI-Powered', '💰 Real Earnings'].map(b => (
            <span key={b} className="badge-green text-base px-4 py-2">{b}</span>
          ))}
        </div>
      </main>

      {/* Features strip */}
      <section className="bg-white border-t border-border py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: '🎯', title: 'AI Skill Discovery', desc: 'Find work that matches your experience and strengths' },
            { icon: '🛒', title: 'Sell Your Products', desc: 'List homemade goods, crafts, and services' },
            { icon: '💬', title: 'Safe Messaging', desc: 'Chat with clients in your language' },
          ].map(f => (
            <div key={f.title} className="flex flex-col items-center text-center gap-2">
              <span className="text-4xl">{f.icon}</span>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
