import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Clock, IndianRupee, ArrowLeft, Share2, Bookmark, CheckCircle } from 'lucide-react'

const mockData = {
  '1': {
    title: 'Home Cooking Classes', category: 'Teaching', pay: '₹500/session',
    payNote: 'Estimated pay based on market rates',
    location: 'Jaipur, Rajasthan', type: 'Part-time', posted: '2 hours ago',
    client: 'Priya Mehta', clientVerified: true,
    description: 'We are looking for an experienced home cook to teach traditional Rajasthani cooking to small groups (2-5 students) on weekends. You will need to teach at a community center near Malviya Nagar.',
    requirements: ['Experience in cooking traditional Indian food', 'Comfortable teaching small groups', 'Available on weekends'],
    skills: ['Cooking', 'Teaching'],
  },
}

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const opp = mockData[id] || {
    title: 'Opportunity Details', category: 'General', pay: '₹500/session',
    payNote: 'Estimated', location: 'India', type: 'Flexible', posted: 'Recently',
    client: 'Employer', clientVerified: false,
    description: 'Full details for this opportunity will be shown here.',
    requirements: ['As per discussion'], skills: ['General'],
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary font-semibold hover:underline min-h-touch" id="btn-back">
        <ArrowLeft size={22} /> Back to Opportunities
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="badge-gray text-sm mb-2 inline-block">{opp.category}</span>
            <h1 className="text-2xl font-bold text-foreground">{opp.title}</h1>
            <div className="mt-3 space-y-2">
              <p className="flex items-center gap-2 text-primary font-bold text-xl">
                <IndianRupee size={20} /> {opp.pay}
              </p>
              <p className="text-xs text-muted italic">⚠️ {opp.payNote}</p>
              <p className="flex items-center gap-2 text-muted"><MapPin size={18} /> {opp.location}</p>
              <p className="flex items-center gap-2 text-muted"><Clock size={18} /> {opp.type} · Posted {opp.posted}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Save"><Bookmark size={22} /></button>
            <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Share"><Share2 size={22} /></button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card space-y-3">
        <h2 className="font-bold text-lg text-foreground">About this Work</h2>
        <p className="text-base text-foreground leading-relaxed">{opp.description}</p>
      </div>

      {/* Requirements */}
      <div className="card space-y-3">
        <h2 className="font-bold text-lg text-foreground">What You Need</h2>
        <ul className="space-y-2">
          {opp.requirements.map(r => (
            <li key={r} className="flex items-start gap-3 text-base">
              <CheckCircle size={20} className="text-primary mt-0.5 shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Client */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl">👤</div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-foreground">{opp.client}</p>
            {opp.clientVerified && <span className="badge-green text-sm">✓ Verified</span>}
          </div>
          <p className="text-muted text-sm">Employer</p>
        </div>
      </div>

      {/* Apply CTA */}
      <div className="sticky bottom-24 lg:bottom-6">
        <button
          onClick={() => alert('Application sent! (Demo mode)')}
          className="btn-primary w-full text-lg py-4 shadow-float"
          id="btn-apply"
        >
          ✋ Apply for This Work
        </button>
      </div>
    </div>
  )
}
