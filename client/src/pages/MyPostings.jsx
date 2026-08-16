import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Clock, MapPin, IndianRupee, Users, CheckCircle, XCircle, RefreshCw, Briefcase, ShoppingBag, ArrowRight } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'

export default function MyPostings() {
  const navigate = useNavigate()
  const [postings, setPostings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)

  const fetchPostings = async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('sh_token')

    try {
      const headers = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${API_BASE_URL}/opportunities/my-postings`, { headers })
      const data = await res.json()
      if (data.success) {
        setPostings(data.data || [])
      } else {
        setError('Could not load your postings.')
      }
    } catch (err) {
      console.error('Failed to fetch postings:', err)
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPostings()
  }, [])

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open'
    const token = localStorage.getItem('sh_token')

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${API_BASE_URL}/opportunities/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(`Posting status updated to ${nextStatus.toUpperCase()}`)
        fetchPostings()
        setTimeout(() => setToastMsg(null), 3000)
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase size={28} className="text-primary" /> My Job & Need Postings
          </h1>
          <p className="text-muted text-sm mt-0.5">Manage your posted requirements and incoming applications</p>
        </div>

        <button
          onClick={() => navigate('/post-job')}
          className="btn-primary py-2.5 px-4 text-sm font-bold flex items-center gap-1.5 shadow-md"
          id="btn-post-new-job"
        >
          <PlusCircle size={18} /> Post New
        </button>
      </div>

      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md animate-fadeIn flex items-center gap-2">
          <CheckCircle size={18} /> {toastMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card h-36 animate-pulse bg-gray-100/70" />)}
        </div>
      ) : error ? (
        <div className="card py-12 text-center space-y-4">
          <p className="font-bold text-lg text-foreground">{error}</p>
          <button onClick={fetchPostings} className="btn-primary flex items-center gap-2 mx-auto">
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      ) : postings.length === 0 ? (
        <div className="card py-14 text-center space-y-4">
          <span className="text-5xl">📋</span>
          <h3 className="font-bold text-xl text-foreground">No active postings yet</h3>
          <p className="text-muted text-base max-w-sm mx-auto">
            Post a job or product requirement to receive applications from top senior citizens and homemakers in your area.
          </p>
          <button
            onClick={() => navigate('/post-job')}
            className="btn-primary mt-2 flex items-center gap-2 mx-auto py-3 px-6 text-base font-bold"
            id="btn-create-first-post"
          >
            <PlusCircle size={20} /> Post Your First Requirement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {postings.map(post => {
            const pId = post._id || post.id
            const isOpen = (post.status || 'open') === 'open'

            return (
              <div key={pId} className="card p-5 space-y-3 border-2 border-border hover:border-primary-300 transition-all shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`badge text-xs ${post.kind === 'product_request' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                        {post.kind === 'product_request' ? '📦 Product Need' : '💼 Service Request'}
                      </span>
                      <span className="badge-gray text-xs">{post.category}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {isOpen ? '🟢 Open for Applicants' : '🔴 Closed'}
                      </span>
                    </div>
                    <h3 className="font-bold text-xl text-foreground">{post.title}</h3>
                  </div>

                  <p className="font-extrabold text-primary text-xl shrink-0">{post.pay}</p>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{post.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border text-muted">
                  <p className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {post.location}</p>
                  <p className="flex items-center gap-1.5 justify-end"><Clock size={14} /> Posted {post.posted || 'Recently'}</p>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/my-postings/${pId}/applications`)}
                    className="btn-primary py-2.5 px-4 text-xs font-extrabold flex items-center gap-2 shadow-xs"
                    id={`btn-view-apps-${pId}`}
                  >
                    <Users size={16} /> View Applicants ({post.applicantCount || 0})
                  </button>

                  <button
                    onClick={() => handleToggleStatus(pId, post.status || 'open')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      isOpen ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {isOpen ? 'Close Posting' : 'Reopen Posting'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
