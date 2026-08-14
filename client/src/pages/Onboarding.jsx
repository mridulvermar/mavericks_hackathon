import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to SilverHands! 🙏',
    subtitle: "Let's set up your profile in 3 easy steps",
    content: null,
  },
  {
    id: 'skills',
    title: 'What are your skills?',
    subtitle: 'Select all that apply — we will help you find the right work',
    options: [
      '🍳 Cooking / Recipes', '🧵 Stitching / Tailoring', '🎨 Painting / Art',
      '📚 Teaching / Tutoring', '💆 Massage / Wellness', '🌿 Gardening',
      '📞 Customer Service', '🖥️ Computer Basics', '📸 Photography',
      '🧹 Household Help', '🧶 Knitting / Crochet', '🪴 Plant Care',
    ],
  },
  {
    id: 'availability',
    title: 'When can you work?',
    subtitle: 'Choose times that work for you',
    options: ['Morning (6am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-9pm)', 'Weekends only', 'Flexible'],
  },
  {
    id: 'language',
    title: 'Preferred Language',
    subtitle: 'We will show content in your language',
    options: ['हिंदी (Hindi)', 'English', 'मराठी (Marathi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'বাংলা (Bengali)', 'ਪੰਜਾਬੀ (Punjabi)', 'ಕನ್ನಡ (Kannada)'],
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState({ skills: [], availability: [], language: '' })

  const currentStep = steps[step]
  const isFirst = step === 0
  const isLast = step === steps.length - 1

  const toggle = (field, value) => {
    setSelections(s => {
      if (field === 'language') return { ...s, language: value }
      const arr = s[field]
      return { ...s, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  const handleNext = () => {
    if (isLast) navigate('/home')
    else setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300
                ${i <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>

        <div className="card p-8 animate-fadeIn">
          <h1 className="text-2xl font-bold text-foreground mb-2">{currentStep.title}</h1>
          <p className="text-muted text-base mb-6">{currentStep.subtitle}</p>

          {currentStep.options && (
            <div className="flex flex-wrap gap-3 mb-6">
              {currentStep.options.map(opt => {
                const field = currentStep.id === 'language' ? 'language' : currentStep.id
                const selected = field === 'language'
                  ? selections.language === opt
                  : selections[field]?.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(field, opt)}
                    className={`px-4 py-3 rounded-xl border-2 font-medium transition-all text-base min-h-touch
                      ${selected
                        ? 'border-primary bg-primary-100 text-primary'
                        : 'border-border text-foreground hover:border-primary-300'
                      }`}
                    aria-pressed={selected}
                    id={`option-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {selected && <Check size={16} className="inline mr-1" />}
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {!currentStep.options && (
            <div className="flex flex-col gap-4 py-6 items-center text-center">
              <span className="text-6xl">🌟</span>
              <p className="text-lg text-foreground max-w-sm">
                We'll use AI to suggest the best opportunities for your skills, schedule, and location.
              </p>
            </div>
          )}

          <div className="flex gap-4 mt-4">
            {!isFirst && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn-secondary flex-1"
                id="btn-back"
              >
                <ChevronLeft size={20} /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="btn-primary flex-1"
              id="btn-next"
            >
              {isLast ? '🚀 Start Exploring' : 'Next'}
              {!isLast && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
