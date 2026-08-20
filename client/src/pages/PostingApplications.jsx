import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react'
import { api } from '../api/axios'

const statusConfig = {
  pending:   { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  confirmed: { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
  cancelled: { label: 'Declined', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
}

export default function PostingApplications() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [postingTitle, setPostingTitle] = useState('')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)
  const [actioning, setActioning] = useState(null)

  const fetchApplications = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/opportunities/${id}/applications`)
      if (res.data.success) {
        setPostingTitle(res.data.postingTitle || 'Job Posting')
        setApplications(res.data.data || [])
      } else {
        setError(res.data.message || 'Failed to load applications.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [id])

  const handleAction = async (appId, action) => {
    setActioning(appId)
    try {
      const res = await api.post(`/bookings/${appId}/${action}`)
      if (res.data.success) {
        setActionMsg(action === 'accept' ? '✅ Applicant approved!' : '❌ Application declined.')
        fetchApplications()
        setTimeout(() => setActionMsg(null), 3000)
      } else {
        setActionMsg(res.data.message || 'Action failed.')
        setTimeout(() => setActionMsg(null), 3500)
      }
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Network error. Please try again.')
      setTimeout(() => setActionMsg(null), 3500)
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/my-postings')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
          aria-label="Back to My Postings"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Users size={22} className="text-primary" />
            Applicants
          </h1>
          <p className="text-sm text-muted font-medium truncate">{postingTitle}</p>
        </div>
      </div>

      {/* Action Toast */}
      {actionMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md animate-fadeIn">
          {actionMsg}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-28 animate-pulse bg-gray-100/70" />
          ))}
        </div>
      ) : error ? (
        <div className="card py-12 text-center space-y-4">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="font-bold text-lg text-foreground">{error}</p>
          <button onClick={fetchApplications} className="btn-primary flex items-center gap-2 mx-auto">
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="card py-14 text-center space-y-3">
          <span className="text-5xl">📭</span>
          <h3 className="font-bold text-xl text-foreground">No applicants yet</h3>
          <p className="text-muted text-base max-w-sm mx-auto">
            Providers will apply to your posting. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted font-semibold">
            {applications.length} applicant{applications.length !== 1 ? 's' : ''} found
          </p>
          {applications.map(app => {
            const appId = app._id || app.id
            const statusKey = (app.status || 'pending').toLowerCase()
            const cfg = statusConfig[statusKey] || statusConfig.pending
            const StatusIcon = cfg.icon
            const isActioning = actioning === appId

            return (
              <div
                key={appId}
                className="card p-5 space-y-3 border-2 border-border hover:border-primary-300 transition-all"
                id={`application-${appId}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {app.icon || '👤'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{app.providerName}</h3>
                      <p className="text-xs text-muted">Applied: {app.date}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-xs shrink-0 ${cfg.color}`}>
                    <StatusIcon size={13} /> {cfg.label}
                  </span>
                </div>

                {/* Skills */}
                {app.providerSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {app.providerSkills.map(s => (
                      <span key={s} className="badge-gray text-xs">{s}</span>
                    ))}
                  </div>
                )}

                {/* Bio / Notes */}
                {app.bio && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl leading-relaxed line-clamp-2">
                    {app.bio}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <p className="font-extrabold text-primary text-base">{app.pay}</p>

                  {statusKey === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(appId, 'reject')}
                        disabled={isActioning}
                        className="btn-secondary text-red-600 border-red-200 py-2 px-4 text-xs font-bold"
                        id={`btn-decline-${appId}`}
                      >
                        {isActioning ? '...' : 'Decline'}
                      </button>
                      <button
                        onClick={() => handleAction(appId, 'accept')}
                        disabled={isActioning}
                        className="btn-primary py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                        id={`btn-approve-${appId}`}
                      >
                        {isActioning ? 'Saving...' : '✓ Approve'}
                      </button>
                    </div>
                  )}
                  {statusKey !== 'pending' && (
                    <button
                      onClick={() => {
                        const seekerId = app.applicantId || app.id || app._id
                        const oppId = app.opportunityId || id
                        const applicantName = app.applicantName || app.providerName || 'Applicant'
                        navigate('/chat', {
                          state: {
                            conversationId: `opp_${oppId}_${seekerId}`,
                            name: applicantName,
                            role: `Applicant • ${postingTitle}`,
                            opportunityTitle: postingTitle,
                            opportunityId: oppId,
                            recipientId: seekerId,
                            recipientName: applicantName,
                            avatar: '👤',
                            initialDraft: `Namaste ${applicantName}, I am reviewing your application for "${postingTitle}".`,
                          },
                        })
                      }}
                      className="btn-secondary text-primary border-primary/30 hover:bg-primary-50 py-2 px-3.5 text-xs font-bold flex items-center gap-1.5"
                      id={`btn-message-${appId}`}
                    >
                      <MessageSquare size={15} /> Message
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
