import React, { useState, useEffect } from 'react'
import { Star, MapPin, Edit, Award, Zap, X, Check, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { API_BASE_URL } from '../api/axios'

export default function MyProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    bio: '',
    skills: '',
  })

  const fetchProfile = async () => {
    setLoading(true)
    const token = localStorage.getItem('sh_token')
    const localUser = JSON.parse(localStorage.getItem('sh_user') || '{}')

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
          localStorage.setItem('sh_user', JSON.stringify(data.user))
        } else {
          setUser(localUser)
        }
      } catch (err) {
        setUser(localUser)
      }
    } else {
      setUser(localUser)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleOpenEdit = () => {
    const currentSkills = Array.isArray(user?.skills) ? user.skills.join(', ') : (user?.skills || '')
    setEditForm({
      name: user?.name || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skills: currentSkills,
    })
    setShowEditModal(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage('')

    const token = localStorage.getItem('sh_token')
    const formattedSkills = editForm.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const updatePayload = {
      name: editForm.name,
      location: editForm.location,
      bio: editForm.bio,
      skills: formattedSkills,
    }

    try {
      if (token) {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
          localStorage.setItem('sh_user', JSON.stringify(data.user))
          setSaveMessage('Profile updated successfully!')
        } else {
          const updated = { ...user, ...updatePayload }
          setUser(updated)
          localStorage.setItem('sh_user', JSON.stringify(updated))
          setSaveMessage('Profile updated locally.')
        }
      } else {
        const updated = { ...user, ...updatePayload }
        setUser(updated)
        localStorage.setItem('sh_user', JSON.stringify(updated))
        setSaveMessage('Profile updated!')
      }
      setTimeout(() => {
        setShowEditModal(false)
        setSaveMessage('')
      }, 1200)
    } catch (err) {
      console.error('Failed to update profile:', err)
      const updated = { ...user, ...updatePayload }
      setUser(updated)
      localStorage.setItem('sh_user', JSON.stringify(updated))
      setShowEditModal(false)
    } finally {
      setSaving(false)
    }
  }

  const displayUser = user || {
    name: 'User',
    location: 'Location not set',
    bio: 'Biography details have not been set yet.',
    skills: [],
  }

  const userSkills = Array.isArray(displayUser.skills) && displayUser.skills.length > 0
    ? displayUser.skills
    : ['🍳 Home Cooking', '🧵 Embroidery', '🎨 Rangoli', '📚 Hindi Teaching']

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                <Edit size={22} className="text-primary" /> Edit Profile
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {saveMessage ? (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                <Check size={20} /> {saveMessage}
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="input text-base"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    className="input text-base"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. T. Nagar, Chennai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bio / About You</label>
                  <textarea
                    className="input text-base h-24"
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Describe your skills and experience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    className="input text-base"
                    value={editForm.skills}
                    onChange={e => setEditForm({ ...editForm, skills: e.target.value })}
                    placeholder="Cooking, Tailoring, Tutoring"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 py-3 font-bold"
                    id="btn-save-profile-confirm"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="card flex flex-col items-center text-center gap-3 py-8">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-5xl">
          👩
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">{displayUser.name}</h2>
            <span className="badge-green text-sm">✓ Verified</span>
          </div>
          <p className="text-muted flex items-center justify-center gap-1 mt-1">
            <MapPin size={16} /> {displayUser.location || 'Jaipur, Rajasthan'}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star size={18} className="text-accent fill-accent" />
            <span className="font-semibold">4.8</span>
            <span className="text-muted">(24 reviews)</span>
          </div>
        </div>
        <p className="text-base text-foreground max-w-sm leading-relaxed">{displayUser.bio || 'Passionate about sharing domestic expertise and earning with wisdom.'}</p>
        <button
          onClick={handleOpenEdit}
          className="btn-secondary mt-2 flex items-center gap-2 font-bold px-5"
          id="btn-edit-profile"
        >
          <Edit size={18} /> Edit Profile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Est. Total Earned', value: '₹12,400', note: 'Estimated', icon: '💰' },
          { label: 'Jobs Done', value: 18, icon: '✅' },
          { label: 'Rating', value: '4.8⭐', icon: '🏆' },
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
          {userSkills.map(s => (
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
