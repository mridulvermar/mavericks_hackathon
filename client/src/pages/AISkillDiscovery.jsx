import React, { useState } from 'react'
import { Bot, Zap, TrendingUp, ChevronRight } from 'lucide-react'

const suggestedSkills = [
  { skill: 'Online Cooking Classes', match: 95, reason: 'Based on your 30+ years of cooking experience', icon: '🍳', earning: '₹500–₹1,500/session' },
  { skill: 'Embroidery Teaching', match: 92, reason: 'Your stitching skills are highly valued', icon: '🧵', earning: '₹300–₹800/session' },
  { skill: 'Recipe Writing', match: 88, reason: 'Content creators need authentic recipes', icon: '📝', earning: '₹200–₹600/recipe' },
  { skill: 'Food Photography', match: 75, reason: 'Combine your cooking with smartphone photography', icon: '📸', earning: '₹400–₹1,200/project' },
]

export default function AISkillDiscovery() {
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const runAnalysis = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setAnalyzed(true) }, 2000)
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap size={28} className="text-accent" /> AI Skill Discovery
        </h1>
        <p className="text-muted mt-1">Our AI analyzes your experience and suggests the best earning opportunities for you</p>
      </div>

      {/* AI Analysis Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <Bot size={36} className="shrink-0" />
          <div>
            <h2 className="font-bold text-xl">AI Career Advisor</h2>
            <p className="text-sm opacity-90 mt-1">
              Tell me about your life experience and I'll find the perfect work for you
            </p>
          </div>
        </div>
        <textarea
          className="mt-4 w-full bg-white/20 placeholder:text-white/70 text-white rounded-xl p-3 text-base border-2 border-white/30 focus:border-white focus:outline-none resize-none"
          rows={3}
          placeholder="E.g. I have been cooking for my family for 35 years, and I know how to stitch sarees..."
          aria-label="Describe your experience"
          id="skill-description-input"
        />
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="mt-3 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-60 min-h-touch flex items-center gap-2"
          id="btn-analyze-skills"
        >
          {loading ? '⏳ Analyzing...' : '🔍 Discover My Skills'}
        </button>
      </div>

      {/* Results */}
      {analyzed && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp size={22} className="text-primary" /> Top Matches for You
          </h2>
          <p className="text-sm text-muted -mt-2">
            ⚠️ Earnings shown are estimates based on market data. Actual income may vary.
          </p>
          {suggestedSkills.map((s, i) => (
            <div key={s.skill} className="card hover:shadow-float transition-all duration-150 cursor-pointer">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{s.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-foreground">{s.skill}</h3>
                    <span className="badge-green text-sm">{s.match}% Match</span>
                  </div>
                  <p className="text-muted text-sm mt-1">{s.reason}</p>
                  <p className="text-primary font-semibold mt-2 flex items-center gap-1">
                    💰 <span className="text-sm">Estimated: {s.earning}</span>
                  </p>
                </div>
                <ChevronRight size={22} className="text-muted shrink-0 mt-1" />
              </div>
              {/* Match bar */}
              <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-700"
                  style={{ width: `${s.match}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!analyzed && !loading && (
        <div className="empty-state">
          <span className="text-6xl">🤖</span>
          <h3 className="font-bold text-xl text-foreground">Ready to Discover?</h3>
          <p className="text-muted max-w-xs">Describe your experience above and our AI will find the perfect work for you</p>
        </div>
      )}
    </div>
  )
}
