import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 text-center gap-6">
      <span className="text-8xl">😕</span>
      <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
      <p className="text-muted text-lg max-w-xs">
        We couldn't find the page you were looking for. It may have moved or doesn't exist.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary text-lg py-4 px-8" id="btn-go-back">
          <ArrowLeft size={22} /> Go Back
        </button>
        <button onClick={() => navigate('/home')} className="btn-primary text-lg py-4 px-8" id="btn-go-home">
          <Home size={22} /> Go to Home
        </button>
      </div>
    </div>
  )
}
