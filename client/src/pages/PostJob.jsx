import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusCircle, Mic, MicOff, Briefcase, ShoppingBag, MapPin, IndianRupee, Calendar, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'

export default function PostJob() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialKind = searchParams.get('type') === 'product_request' ? 'product_request' : 'job'

  const [kind, setKind] = useState(initialKind) // 'job' | 'product_request'
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Cooking')
  const [description, setDescription] = useState('')
  const [pay, setPay] = useState('')
  const [location, setLocation] = useState('T. Nagar, Chennai')
  const [preferredDate, setPreferredDate] = useState('2026-08-22')

  const [isListening, setIsListening] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successModal, setSuccessModal] = useState(false)

  const recognitionRef = useRef(null)
  const baseDescriptionRef = useRef('')

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your description.')
      return
    }

    try {
      if (recognitionRef.current) recognitionRef.current.stop()

      baseDescriptionRef.current = description.trim()

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (e) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = 0; i < e.results.length; i++) {
          const result = e.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' '
          } else {
            interimTranscript += result[0].transcript
          }
        }

        const currentSpeech = (finalTranscript + interimTranscript).trim()
        const combined = baseDescriptionRef.current
          ? `${baseDescriptionRef.current} ${currentSpeech}`.trim()
          : currentSpeech

        const clean = combined.replace(/\b(\w+)( \1\b)+/gi, '$1')
        setDescription(clean)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognition.start()
      recognitionRef.current = recognition
    } catch {
      setIsListening(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Please enter a title for your requirement.')
    if (!pay.trim()) return setError('Please enter a budget / pay amount.')
    if (!location.trim()) return setError('Please enter your location.')

    setSubmitting(true)
    const token = localStorage.getItem('sh_token')
    const user = JSON.parse(localStorage.getItem('sh_user') || '{}')

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${API_BASE_URL}/opportunities`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim() || 'No additional details provided.',
          pay: pay.trim(),
          location: location.trim(),
          kind,
          clientName: user.name || 'Anand Kumar (Customer)',
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSuccessModal(true)
      } else {
        setError(data.message || 'Failed to publish posting.')
      }
    } catch (err) {
      console.error('Error posting requirement:', err)
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PlusCircle size={28} className="text-primary" /> Post What You Need
          </h1>
          <p className="text-muted text-sm mt-0.5">Senior citizens & local specialists near you will apply!</p>
        </div>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="font-extrabold text-2xl text-foreground">Posting Published!</h3>
            <p className="text-base text-gray-700 bg-green-50 p-4 rounded-2xl border border-green-200">
              Your {kind === 'product_request' ? 'product requirement' : 'job request'} <strong>"{title}"</strong> is now live! Local providers will see it and apply.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/my-postings')}
                className="btn-primary flex-1 py-3 font-bold"
                id="btn-view-postings"
              >
                View My Postings
              </button>
              <button
                onClick={() => {
                  setSuccessModal(false)
                  setTitle('')
                  setDescription('')
                  setPay('')
                }}
                className="btn-secondary flex-1 py-3 font-bold"
              >
                Post Another
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* Requirement Type Selector */}
      <div className="card p-4 space-y-3">
        <label className="block text-sm font-extrabold text-foreground">What kind of requirement is this?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setKind('job')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col items-start gap-2 ${
              kind === 'job' ? 'border-primary bg-primary-50 text-primary font-bold shadow-xs' : 'border-border text-foreground hover:border-gray-300'
            }`}
          >
            <Briefcase size={26} />
            <div>
              <p className="font-bold text-base">💼 Service / Job Request</p>
              <p className="text-xs text-muted font-normal mt-0.5">Need a cook, tutor, tailor, or home help</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setKind('product_request')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col items-start gap-2 ${
              kind === 'product_request' ? 'border-primary bg-primary-50 text-primary font-bold shadow-xs' : 'border-border text-foreground hover:border-gray-300'
            }`}
          >
            <ShoppingBag size={26} />
            <div>
              <p className="font-bold text-base">📦 Product Requirement</p>
              <p className="text-xs text-muted font-normal mt-0.5">Need custom pickles, snacks, or crafts made</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5 shadow-card">
        {/* Title */}
        <div>
          <label className="block text-sm font-extrabold text-foreground mb-1">
            {kind === 'product_request' ? 'Product Needed' : 'Job Title'}
          </label>
          <input
            type="text"
            className="input text-base font-medium"
            placeholder={kind === 'product_request' ? 'e.g. 2kg Homemade Mango Avakkai Pickle' : 'e.g. Home Cook for 4-Person Family'}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-extrabold text-foreground mb-1">Category</label>
          <select
            className="input text-base"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="Cooking">🍳 Cooking & Catering</option>
            <option value="Tailoring">🧵 Tailoring & Embroidery</option>
            <option value="Tutoring">📚 Tutoring & Teaching</option>
            <option value="Crafts">🎨 Handicrafts & Art</option>
            <option value="Home Care">🏠 Home & Gardening Help</option>
            <option value="Other">💼 Other Domestic Service</option>
          </select>
        </div>

        {/* Description with Voice Input option */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-extrabold text-foreground">Description & Details</label>
            <button
              type="button"
              onClick={startVoiceInput}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                isListening ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-primary-50 text-primary border-primary-200 hover:bg-primary-100'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? 'Listening...' : '🎙️ Voice Input'}
            </button>
          </div>
          <textarea
            className="input text-base h-28 leading-relaxed"
            placeholder="Describe what you need, specific preferences, schedule, or quantity..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Budget & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-extrabold text-foreground mb-1 flex items-center gap-1">
              <IndianRupee size={16} className="text-primary" /> Budget / Offer Amount
            </label>
            <input
              type="text"
              className="input text-base font-semibold"
              placeholder="e.g. ₹600 / session or ₹400 / kg"
              value={pay}
              onChange={e => setPay(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-foreground mb-1 flex items-center gap-1">
              <MapPin size={16} className="text-primary" /> Location / Area
            </label>
            <input
              type="text"
              className="input text-base font-semibold"
              placeholder="e.g. T. Nagar, Chennai"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-extrabold text-foreground mb-1 flex items-center gap-1">
            <Calendar size={16} className="text-primary" /> Preferred Start Date
          </label>
          <input
            type="date"
            className="input text-base"
            value={preferredDate}
            onChange={e => setPreferredDate(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-4 text-lg font-extrabold shadow-float flex items-center justify-center gap-2"
            id="btn-publish-posting"
          >
            {submitting ? 'Publishing...' : '🚀 Publish Requirement'}
          </button>
        </div>
      </form>
    </div>
  )
}
