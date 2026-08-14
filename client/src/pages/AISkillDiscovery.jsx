import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  Mic,
  MicOff,
  Edit3,
  CheckCircle2,
  Sparkles,
  Bot,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  Briefcase,
  Check,
} from 'lucide-react'
import aiAPI from '../api/ai'
import authAPI from '../api/auth'

export default function AISkillDiscovery() {
  const navigate = useNavigate()
  const [inputMode, setInputMode] = useState('type') // 'speak' | 'type'
  const [description, setDescription] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [speechNotice, setSpeechNotice] = useState('')

  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState('')

  // Profile Generation step state
  const [generatingProfile, setGeneratingProfile] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
    }
  }, [])

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      setSpeechNotice('Voice recognition is not supported on this browser. Please use typing mode.')
      setInputMode('type')
      return
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-IN' // Supports English/Hindi Indian accents

      recognition.onstart = () => {
        setIsListening(true)
        setSpeechNotice('🎙️ Listening... Speak naturally about your skills and experience.')
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setDescription(prev => prev ? `${prev} ${transcript}` : transcript)
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setSpeechNotice('Microphone permission denied. Please allow microphone access or type instead.')
        } else {
          setSpeechNotice('Voice recognition paused. You can continue typing below.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      console.error('Speech setup error:', err)
      setIsListening(false)
      setSpeechNotice('Could not start voice input. Please use typing mode instead.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setSpeechNotice('')
  }

  const handleDiscoverSkills = async () => {
    setError('')
    if (!description.trim()) {
      return setError('Please describe what you know or click the Speak button to dictate.')
    }

    if (isListening) stopListening()

    setAnalyzing(true)
    setAnalysisResult(null)
    setProfileData(null)

    try {
      const res = await aiAPI.discoverSkills(description.trim())
      if (res.success) {
        setAnalysisResult(res)
      } else {
        setError(res.message || 'Failed to analyze skills. Please try again.')
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error processing request.'
      setError(errMsg)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateProfile = async () => {
    setError('')
    setGeneratingProfile(true)
    try {
      const extractedSkills = analysisResult?.skills?.map(s => s.name) || []
      const res = await aiAPI.generateProfile({
        description: description.trim(),
        skills: extractedSkills,
      })

      if (res.success) {
        setProfileData(res)
      } else {
        setError(res.message || 'Failed to generate profile.')
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error generating profile.'
      setError(errMsg)
    } finally {
      setGeneratingProfile(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileData) return
    setSavingProfile(true)
    setError('')

    try {
      const updatedSkills = Array.isArray(profileData.skills)
        ? profileData.skills
        : typeof profileData.skills === 'string'
        ? profileData.skills.split(',').map(s => s.trim())
        : []

      const res = await authAPI.updateOnboarding({
        bio: profileData.about,
        skills: updatedSkills,
      })

      if (res.success) {
        setSaveSuccess(true)
        localStorage.setItem('sh_user', JSON.stringify(res.user))
        setTimeout(() => {
          navigate('/profile')
        }, 1500)
      } else {
        setError(res.message || 'Failed to save profile.')
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error saving profile.'
      setError(errMsg)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground flex items-center gap-2">
          <Zap size={32} className="text-accent fill-accent" /> Tell Us What You Know
        </h1>
        <p className="text-muted mt-1 text-base">
          Describe your life experience, hobbies, or domestic skills — our AI will find your best earning opportunities and draft your profile!
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Mode Selector & Text Area */}
      {!profileData && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-bold text-foreground">Choose Input Method:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputMode('speak')
                  if (!isListening) startListening()
                }}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm min-h-touch flex items-center gap-2 transition-all
                  ${inputMode === 'speak'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-foreground hover:bg-gray-200'
                  }`}
              >
                <Mic size={18} /> 🎙️ Speak
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('type')
                  if (isListening) stopListening()
                }}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm min-h-touch flex items-center gap-2 transition-all
                  ${inputMode === 'type'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-foreground hover:bg-gray-200'
                  }`}
              >
                <Edit3 size={18} /> ✍️ Type
              </button>
            </div>
          </div>

          {speechNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium">
              {speechNotice}
            </div>
          )}

          {/* Voice Active Bar */}
          {inputMode === 'speak' && (
            <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-gray-400'}`} />
                <span className="font-semibold text-primary text-base">
                  {isListening ? 'Microphone Active — Speak Now...' : 'Voice Ready'}
                </span>
              </div>
              {isListening ? (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-3 py-1.5 bg-red-100 text-red-700 font-semibold rounded-lg text-sm hover:bg-red-200 min-h-touch"
                >
                  <MicOff size={16} className="inline mr-1" /> Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startListening}
                  className="px-3 py-1.5 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-700 min-h-touch"
                >
                  <Mic size={16} className="inline mr-1" /> Start Speaking
                </button>
              )}
            </div>
          )}

          {/* Textarea */}
          <div>
            <textarea
              className="input text-lg min-h-[140px] resize-none"
              rows={4}
              placeholder="E.g., I have been cooking traditional meals for my family for 35 years. I specialize in Rajasthani dishes, making mango pickles, and hand stitching sarees..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              id="skills-textarea"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted">
              Tip: Include years of experience or specific dishes/crafts you know well!
            </span>
            <button
              type="button"
              onClick={handleDiscoverSkills}
              disabled={analyzing || !description.trim()}
              className="btn-primary px-6 py-3 text-base"
              id="btn-discover-skills"
            >
              {analyzing ? (
                '🤖 AI Analyzing...'
              ) : (
                <>
                  <Sparkles size={20} /> 🔍 Discover My Skills
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading Animation */}
      {analyzing && (
        <div className="card p-8 text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
            <Bot size={36} />
          </div>
          <h3 className="text-xl font-bold text-foreground">AI Analyzing Your Wisdom...</h3>
          <p className="text-muted text-base max-w-md mx-auto">
            We are extracting your skills, estimating experience years, and matching you with high-value earning opportunities.
          </p>
        </div>
      )}

      {/* Step 1 Results: Skill Chips & Recommendations */}
      {analysisResult && !profileData && !analyzing && (
        <div className="space-y-6 animate-fadeIn">
          {/* Recommendation Banner */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-2xl p-6 text-white shadow-float">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bot size={28} />
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                  AI Career Recommendation
                </span>
                <p className="text-lg font-medium leading-snug">
                  "{analysisResult.recommendation}"
                </p>
              </div>
            </div>
          </div>

          {/* Discovered Skill Chips */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={22} className="text-primary" /> Discovered Skills & Experience
              </h2>
              <span className="badge-green text-sm font-semibold">
                {analysisResult.experienceYears}+ Years Estimated Experience
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {analysisResult.skills?.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border-2 border-primary-200 bg-primary-50/50 flex items-center gap-3"
                >
                  <span className="text-3xl">{s.icon || '✨'}</span>
                  <div>
                    <h3 className="font-bold text-foreground text-base">{s.name}</h3>
                    <p className="text-xs text-primary font-semibold">Matched with Market Demand</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Services & Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 space-y-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Suggested Services You Can Offer
              </h3>
              <ul className="space-y-2">
                {analysisResult.suggestedServices?.map((serv, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <span>{serv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5 space-y-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <ShoppingBag size={20} className="text-accent" /> Suggested Products You Can Sell
              </h3>
              <ul className="space-y-2">
                {analysisResult.suggestedProducts?.map((prod, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={16} className="text-accent shrink-0" />
                    <span>{prod}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action to Generate Profile */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGenerateProfile}
              disabled={generatingProfile}
              className="btn-primary px-8 py-4 text-lg w-full sm:w-auto"
              id="btn-use-skills-generate"
            >
              {generatingProfile ? (
                '⏳ Generating Your Profile...'
              ) : (
                <>
                  <Sparkles size={22} /> Use These Skills & Generate Profile <ArrowRight size={22} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 Profile Review & Generation Screen */}
      {profileData && (
        <div className="space-y-6 animate-fadeIn">
          {saveSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-base font-bold flex items-center gap-3">
              <Check size={24} className="text-green-600" />
              <span>Profile updated successfully! Redirecting to your profile page...</span>
            </div>
          )}

          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={24} className="text-primary" /> Generated AI Profile Preview
                </h2>
                <p className="text-muted text-sm mt-0.5">
                  Review and customize your professional headline and bio before saving.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="btn-secondary px-4 py-2 text-sm"
                id="btn-edit-generated-profile"
              >
                <Edit3 size={16} /> {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                Professional Headline
              </label>
              {isEditingProfile ? (
                <input
                  type="text"
                  className="input text-lg font-bold"
                  value={profileData.headline}
                  onChange={e => setProfileData(p => ({ ...p, headline: e.target.value }))}
                />
              ) : (
                <p className="text-xl font-bold text-primary">{profileData.headline}</p>
              )}
            </div>

            {/* About / Bio */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                About / Bio
              </label>
              {isEditingProfile ? (
                <textarea
                  className="input text-base resize-none"
                  rows={4}
                  value={profileData.about}
                  onChange={e => setProfileData(p => ({ ...p, about: e.target.value }))}
                />
              ) : (
                <p className="text-base text-foreground leading-relaxed bg-gray-50 p-4 rounded-xl border border-border">
                  {profileData.about}
                </p>
              )}
            </div>

            {/* Confirmed Skills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                Skills Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(profileData.skills) ? profileData.skills : []).map((skill, idx) => (
                  <span key={idx} className="badge-green text-sm px-3 py-1.5 font-semibold">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested Service Offers */}
            {profileData.serviceDescriptions && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                  Service Offerings
                </label>
                <div className="space-y-2">
                  {profileData.serviceDescriptions.map((desc, idx) => (
                    <div key={idx} className="p-3 bg-primary-50/50 border border-primary-100 rounded-xl text-sm font-medium text-foreground">
                      • {desc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accept & Save Buttons */}
            <div className="flex gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setProfileData(null)}
                disabled={savingProfile}
                className="btn-secondary flex-1 text-base py-3"
              >
                Back to Skills
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile || saveSuccess}
                className="btn-primary flex-1 text-base py-3"
                id="btn-accept-save-profile"
              >
                {savingProfile ? (
                  '⏳ Saving Profile...'
                ) : (
                  <>
                    <Check size={20} /> Accept & Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
