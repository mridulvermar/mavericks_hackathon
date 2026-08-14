import React from 'react'
import { Star, MapPin, Edit, Award, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const profile = {
  name: 'Sunita Sharma',
  age: 58,
  city: 'Jaipur, Rajasthan',
  bio: 'Experienced home cook and embroidery teacher with 30+ years of experience. Love to share my skills and earn from home.',
  skills: ['🍳 Home Cooking', '🧵 Embroidery', '🎨 Rangoli', '📚 Hindi Teaching'],
  rating: 4.8,
  reviews: 24,
  earnings: '₹12,400',
  completedJobs: 18,
  verified: true,
}

export default function MyProfile() {
  const navigate = useNavigate()
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      {/* Profile Card */}
      <div className="card flex flex-col items-center text-center gap-3 py-8">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-5xl">
          👩
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
            {profile.verified && (
              <span className="badge-green text-sm">✓ Verified</span>
            )}
          </div>
          <p className="text-muted flex items-center justify-center gap-1 mt-1">
            <MapPin size={16} /> {profile.city}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star size={18} className="text-accent fill-accent" />
            <span className="font-semibold">{profile.rating}</span>
            <span className="text-muted">({profile.reviews} reviews)</span>
          </div>
        </div>
        <p className="text-base text-foreground max-w-sm leading-relaxed">{profile.bio}</p>
        <button
          onClick={() => {}}
          className="btn-secondary mt-2"
          id="btn-edit-profile"
        >
          <Edit size={18} /> Edit Profile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Est. Total Earned', value: profile.earnings, note: 'Estimated', icon: '💰' },
          { label: 'Jobs Done', value: profile.completedJobs, icon: '✅' },
          { label: 'Rating', value: `${profile.rating}⭐`, icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted leading-tight">{s.label}</div>
            {s.note && <div className="text-xs text-muted italic">{s.note}</div>}
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Zap size={20} className="text-accent" /> My Skills</h3>
          <button onClick={() => navigate('/skills')} className="text-primary font-semibold text-sm hover:underline">
            Discover More →
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map(s => (
            <span key={s} className="badge-green text-base px-4 py-2">{s}</span>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Award size={20} className="text-accent" /> Achievements</h3>
        <div className="space-y-3">
          {[
            { icon: '🥇', label: 'First Booking', earned: true },
            { icon: '⭐', label: 'Top Rated Worker', earned: true },
            { icon: '💯', label: '10 Jobs Completed', earned: true },
            { icon: '🚀', label: '50 Jobs Completed', earned: false },
          ].map(a => (
            <div key={a.label} className={`flex items-center gap-3 p-3 rounded-xl ${a.earned ? 'bg-primary-50' : 'bg-gray-50 opacity-50'}`}>
              <span className="text-2xl">{a.icon}</span>
              <span className="font-medium text-foreground">{a.label}</span>
              {a.earned && <span className="ml-auto badge-green text-sm">Earned!</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
