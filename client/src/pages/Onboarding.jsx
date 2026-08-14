import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react'
import authAPI from '../api/auth'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    role: 'provider',
    providerType: 'senior_citizen',
    name: '',
    age: '',
    location: '',
    languages: ['Hindi', 'English'],
    skills: [],
    bio: '',
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sh_user')
      if (stored) {
        const u = JSON.parse(stored)
        setFormData(f => ({
          ...f,
          name: u.name || f.name,
          role: u.role || f.role,
          providerType: u.providerType || f.providerType,
          location: u.city || u.location || f.location,
          age: u.age || f.age,
          languages: u.languages?.length ? u.languages : f.languages,
          skills: u.skills?.length ? u.skills : f.skills,
        }))
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, [])

  const steps = [
    {
      title: 'Step 1: Select Your Role 🎯',
      subtitle: 'Tell us how you plan to use SilverHands',
    },
    {
      title: 'Step 2: Basic Details 📝',
      subtitle: 'Help others know you better',
    },
    {
      title: 'Step 3: Languages & Skills 🌟',
      subtitle: 'Select all languages you speak and skills you possess',
    },
  ]

  const totalSteps = steps.length

  const handleNext = async () => {
    setError('')
    if (step === 0) {
      setStep(1)
      return
    }

    if (step === 1) {
      if (!formData.name.trim()) return setError('Please enter your name.')
      if (!formData.location.trim()) return setError('Please enter your city/location.')
      setStep(2)
      return
    }

    // Step 2 (Final submission)
    setLoading(true)
    try {
      const res = await authAPI.updateOnboarding({
        role: formData.role,
        providerType: formData.providerType,
        name: formData.name.trim(),
        age: formData.age ? Number(formData.age) : undefined,
        location: formData.location.trim(),
        languages: formData.languages,
        skills: formData.skills,
        bio: formData.bio.trim(),
      })

      if (res.success) {
        localStorage.setItem('sh_user', JSON.stringify(res.user))
        navigate('/home')
      } else {
        setError(res.message || 'Failed to complete onboarding.')
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to save onboarding data.'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setError('')
    if (step > 0) setStep(s => s - 1)
  }

  const toggleLanguage = (lang) => {
    setFormData(f => {
      const exists = f.languages.includes(lang)
      return {
        ...f,
        languages: exists ? f.languages.filter(l => l !== lang) : [...f.languages, lang],
      }
    })
  }

  const toggleSkill = (skill) => {
    setFormData(f => {
      const exists = f.skills.includes(skill)
      return {
        ...f,
        skills: exists ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
      }
    })
  }

  const availableLanguages = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Punjabi', 'Kannada']
  const availableSkills = [
    '🍳 Cooking & Recipes', '🧵 Stitching & Tailoring', '🎨 Painting & Craft',
    '📚 Teaching & Tutoring', '💆 Caregiving & Elder Help', '🌿 Gardening & Plant Care',
    '📞 Customer Support', '🧶 Knitting & Embroidery', '📝 Content Writing',
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg">
        {/* Step Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-semibold text-primary mb-2">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{Math.round(((step + 1) / totalSteps) * 100)}% Completed</span>
          </div>
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-full transition-all duration-300
                  ${i <= step ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-float animate-fadeIn">
          <h1 className="text-2xl font-bold text-foreground mb-1">{steps[step].title}</h1>
          <p className="text-muted text-base mb-6">{steps[step].subtitle}</p>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SCREEN 1: Role Selection */}
          {step === 0 && (
            <div className="space-y-4 py-2">
              {[
                {
                  id: 'senior_citizen',
                  role: 'provider',
                  providerType: 'senior_citizen',
                  title: '👴 Senior Citizen',
                  desc: 'Share your life wisdom, teach, mentor, or provide specialized home services.',
                },
                {
                  id: 'homemaker',
                  role: 'provider',
                  providerType: 'homemaker',
                  title: '👩 Homemaker',
                  desc: 'Monetize domestic skills like home cooking, tailoring, and handmade crafts.',
                },
                {
                  id: 'customer',
                  role: 'customer',
                  providerType: 'none',
                  title: '🔍 Customer / Employer',
                  desc: 'Find and hire trusted elders & homemakers for home services, classes, and products.',
                },
              ].map((option) => {
                const selected =
                  formData.role === option.role && formData.providerType === option.providerType
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setFormData(f => ({ ...f, role: option.role, providerType: option.providerType }))
                    }
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all min-h-touch flex items-center justify-between
                      ${selected
                        ? 'border-primary bg-primary-50 text-primary shadow-sm'
                        : 'border-border text-foreground hover:border-primary-200'
                      }`}
                  >
                    <div>
                      <div className="text-lg font-bold">{option.title}</div>
                      <div className="text-sm text-muted mt-1 leading-snug">{option.desc}</div>
                    </div>
                    {selected && <Check size={24} className="text-primary shrink-0 ml-2" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* SCREEN 2: Basic Info */}
          {step === 1 && (
            <div className="space-y-5 py-2">
              <div>
                <label className="block text-base font-semibold text-foreground mb-2">
                  👤 Full Name
                </label>
                <input
                  type="text"
                  className="input text-lg"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-foreground mb-2">
                  📍 City / Location
                </label>
                <input
                  type="text"
                  className="input text-lg"
                  placeholder="e.g. Jaipur, Rajasthan"
                  value={formData.location}
                  onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-foreground mb-2">
                  🎂 Age (Optional)
                </label>
                <input
                  type="number"
                  className="input text-lg"
                  placeholder="e.g. 62"
                  value={formData.age}
                  onChange={e => setFormData(f => ({ ...f, age: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* SCREEN 3: Languages & Skills */}
          {step === 2 && (
            <div className="space-y-6 py-2">
              <div>
                <label className="block text-base font-semibold text-foreground mb-3">
                  🗣️ Languages You Speak
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => {
                    const selected = formData.languages.includes(lang)
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all text-base min-h-touch
                          ${selected
                            ? 'border-primary bg-primary-100 text-primary font-semibold'
                            : 'border-border text-foreground hover:border-primary-300'
                          }`}
                      >
                        {selected && '✓ '} {lang}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-foreground mb-3">
                  ✨ Skills & Expertise
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const selected = formData.skills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all text-base min-h-touch
                          ${selected
                            ? 'border-primary bg-primary-100 text-primary font-semibold'
                            : 'border-border text-foreground hover:border-primary-300'
                          }`}
                      >
                        {selected && '✓ '} {skill}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-foreground mb-2">
                  💬 Short Bio (Optional)
                </label>
                <textarea
                  className="input text-base resize-none"
                  rows={2}
                  placeholder="Tell clients a bit about your journey & experience..."
                  value={formData.bio}
                  onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Navigation Controls: [Back] and [Continue] only */}
          <div className="flex gap-4 mt-8 pt-4 border-t border-border">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="btn-secondary flex-1 text-lg py-3.5"
                id="btn-onboarding-back"
              >
                <ChevronLeft size={22} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="btn-primary flex-1 text-lg py-3.5"
              id="btn-onboarding-continue"
            >
              {loading ? (
                '⏳ Completing...'
              ) : step === totalSteps - 1 ? (
                '🚀 Finish & Go to Dashboard'
              ) : (
                <>Continue <ChevronRight size={22} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
