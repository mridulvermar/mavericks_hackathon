import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, ArrowLeft, Phone, Languages, Sparkles, CheckCheck, Check, Briefcase, ExternalLink } from 'lucide-react'
import { io } from 'socket.io-client'

import { API_BASE_URL, SOCKET_URL } from '../api/axios'

export default function Chat() {
  const navigate = useNavigate()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [translations, setTranslations] = useState({}) // msgId -> translatedText
  const [translationErrors, setTranslationErrors] = useState({}) // msgId -> error
  const [translatingId, setTranslatingId] = useState(null)

  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  const currentUser = JSON.parse(localStorage.getItem('sh_user') || '{}')
  const currentUserId = currentUser._id || currentUser.id || 'u_user'
  const currentUserName = currentUser.name || (currentUser.role === 'job_provider' ? 'Job Provider' : 'Job Seeker')

  // Initialize Socket.IO
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      console.log('⚡ Socket connected to server')
      socketRef.current.emit('user:join', currentUserId)
      if (activeChat) {
        const activeConvId = activeChat._id || activeChat.id || activeChat.conversationId
        if (activeConvId) socketRef.current.emit('chat:join', activeConvId)
      }
    })

    socketRef.current.on('chat:message', (newMsg) => {
      // If message is for currently open conversation
      const activeConvId = activeChat?._id || activeChat?.id || activeChat?.conversationId
      if (activeChat && (newMsg.conversationId === activeConvId || (newMsg.roomId && newMsg.roomId === activeConvId))) {
        setMessages((prevMsgs) => {
          // Robust check to match existing optimistic message
          const existingIdx = prevMsgs.findIndex((m) => {
            if (newMsg.clientMsgId && (m.clientMsgId === newMsg.clientMsgId || m._id === newMsg.clientMsgId || m.id === newMsg.clientMsgId)) {
              return true
            }
            if ((m._id && (m._id === newMsg._id || m._id === newMsg.id)) || (m.id && (m.id === newMsg._id || m.id === newMsg.id))) {
              return true
            }
            if (m.text === newMsg.text && (String(m.senderId) === String(newMsg.senderId) || (m.sender === 'me' && String(newMsg.senderId) === String(currentUserId)))) {
              return true
            }
            return false
          })

          if (existingIdx !== -1) {
            const updated = [...prevMsgs]
            updated[existingIdx] = {
              ...updated[existingIdx],
              ...newMsg,
              _id: newMsg._id || updated[existingIdx]._id,
              id: newMsg._id || updated[existingIdx].id,
              status: newMsg.status || 'delivered',
              time: newMsg.timestamp || newMsg.time || updated[existingIdx].time,
            }
            return updated
          }
          return [...prevMsgs, newMsg]
        })
      }

      // Also update conversations list with latest message
      setConversations((prevConvs) => {
        const convId = newMsg.conversationId
        const existingIdx = prevConvs.findIndex((c) => (c._id || c.id || c.conversationId) === convId)
        const otherPartyName = String(newMsg.senderId) === String(currentUserId)
          ? (newMsg.recipientName || 'Job Contact')
          : (newMsg.senderName || 'Job Contact')

        if (existingIdx !== -1) {
          const updated = [...prevConvs]
          updated[existingIdx] = {
            ...updated[existingIdx],
            lastMsg: newMsg.text,
            time: newMsg.timestamp || newMsg.time || 'Now',
            latestTime: Date.now(),
            name: updated[existingIdx].name && updated[existingIdx].name !== currentUserName ? updated[existingIdx].name : otherPartyName,
          }
          return updated.sort((a, b) => (b.latestTime || 0) - (a.latestTime || 0))
        } else {
          const newConvItem = {
            _id: convId,
            id: convId,
            conversationId: convId,
            name: otherPartyName,
            role: newMsg.opportunityTitle ? `Job: ${newMsg.opportunityTitle}` : 'Direct Message',
            opportunityTitle: newMsg.opportunityTitle || null,
            opportunityId: newMsg.opportunityId || null,
            lastMsg: newMsg.text,
            time: newMsg.timestamp || newMsg.time || 'Now',
            latestTime: Date.now(),
            avatar: newMsg.opportunityTitle ? '💼' : '💬',
            online: true,
          }
          return [newConvItem, ...prevConvs]
        }
      })
    })

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [activeChat, currentUserId, currentUserName])

  // Handle direct navigation via location.state (e.g. from Message button)
  useEffect(() => {
    if (location.state?.conversationId) {
      const convId = location.state.conversationId
      const targetConv = {
        _id: convId,
        id: convId,
        conversationId: convId,
        name: location.state.name || (currentUser.role === 'job_provider' ? 'Job Seeker' : 'Job Provider'),
        role: location.state.role || (location.state.opportunityTitle ? `Job: ${location.state.opportunityTitle}` : 'Direct Message'),
        avatar: location.state.avatar || (location.state.opportunityTitle ? '💼' : '💬'),
        opportunityTitle: location.state.opportunityTitle || null,
        opportunityId: location.state.opportunityId || null,
        recipientId: location.state.recipientId || '',
        recipientName: location.state.name || location.state.recipientName || '',
        online: true,
      }
      setActiveChat(targetConv)

      if (location.state.initialDraft) {
        setInput(location.state.initialDraft)
      }

      setConversations((prev) => {
        if (prev.some((c) => (c._id || c.id || c.conversationId) === convId)) {
          return prev.map((c) => (c._id || c.id || c.conversationId) === convId ? { ...c, ...targetConv } : c)
        }
        return [targetConv, ...prev]
      })
    }
  }, [location.state])

  // Fetch real Conversations from backend
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('sh_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/chat/conversations?userId=${encodeURIComponent(currentUserId)}&userName=${encodeURIComponent(currentUser.name || '')}`, {
        headers,
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setConversations((prev) => {
          const fetchedMap = new Map(data.data.map((c) => [c._id || c.id || c.conversationId, c]))
          const customActive = prev.filter((c) => !fetchedMap.has(c._id || c.id || c.conversationId))
          return [...customActive, ...data.data]
        })
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and auto-reload polling for conversations list
  useEffect(() => {
    fetchConversations()
    if (!activeChat) {
      const convInterval = setInterval(fetchConversations, 3000)
      return () => clearInterval(convInterval)
    }
  }, [activeChat, currentUserId])

  // Fetch Messages and auto-reload polling when Active Chat is open
  useEffect(() => {
    if (!activeChat) return

    const chatId = activeChat._id || activeChat.id || activeChat.conversationId
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:join', chatId)
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/chat/conversations/${chatId}/messages`)
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setMessages((prev) => {
            const prevSignature = prev.map((m) => `${m._id || m.id || m.clientMsgId}_${m.text}`).join('|')
            const newSignature = data.data.map((m) => `${m._id || m.id || m.clientMsgId}_${m.text}`).join('|')
            if (prevSignature === newSignature) return prev
            return data.data
          })
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err)
      }
    }

    fetchMessages()
    // Auto-reload polling every 2 seconds for real-time responsiveness
    const pollInterval = setInterval(fetchMessages, 2000)
    return () => clearInterval(pollInterval)
  }, [activeChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChat])

  // Send Message
  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return

    const chatId = activeChat._id || activeChat.id || activeChat.conversationId
    const textToSend = input.trim()
    setInput('')

    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const newMsgPayload = {
      _id: tempId,
      id: tempId,
      clientMsgId: tempId,
      conversationId: chatId,
      roomId: chatId,
      text: textToSend,
      senderId: currentUserId,
      sender: 'me',
      senderName: currentUserName,
      recipientId: activeChat.recipientId || '',
      recipientName: activeChat.name || '',
      opportunityTitle: activeChat.opportunityTitle || null,
      opportunityId: activeChat.opportunityId || null,
      status: 'sent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }

    // Optimistically add to messages
    setMessages((prev) => [...prev, newMsgPayload])

    // Update conversation in list
    setConversations((prev) => {
      const idx = prev.findIndex((c) => (c._id || c.id || c.conversationId) === chatId)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], lastMsg: textToSend, time: 'Now', latestTime: Date.now() }
        return copy.sort((a, b) => (b.latestTime || 0) - (a.latestTime || 0))
      }
      return [{ ...activeChat, lastMsg: textToSend, time: 'Now', latestTime: Date.now() }, ...prev]
    })

    // Real-time broadcast via Socket.IO
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:message', newMsgPayload)
    } else {
      // Fallback only if socket disconnected
      try {
        const res = await fetch(`${API_BASE_URL}/chat/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMsgPayload),
        })
        const data = await res.json()
        if (data.success && data.data) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? { ...m, ...data.data, sender: 'me' } : m))
          )
        }
      } catch (err) {
        console.error('HTTP Send fallback error:', err)
      }
    }
  }

  // Per-Message Opt-In AI Translation Handler
  const handleTranslateMessage = async (msgId, text) => {
    if (translations[msgId]) {
      setTranslations((prev) => {
        const copy = { ...prev }
        delete copy[msgId]
        return copy
      })
      setTranslationErrors((prev) => { const c = { ...prev }; delete c[msgId]; return c })
      return
    }

    setTranslatingId(msgId)
    setTranslationErrors((prev) => { const c = { ...prev }; delete c[msgId]; return c })
    try {
      const res = await fetch(`${API_BASE_URL}/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'ta' }),
      })
      const data = await res.json()
      if (data.success && data.translatedText) {
        setTranslations((prev) => ({ ...prev, [msgId]: data.translatedText }))
      } else {
        setTranslationErrors((prev) => ({ ...prev, [msgId]: 'Translation failed. Try again.' }))
      }
    } catch (err) {
      console.error('Translation error:', err)
      setTranslationErrors((prev) => ({ ...prev, [msgId]: 'Could not reach server. Try again.' }))
    } finally {
      setTranslatingId(null)
    }
  }

  // Conversation List View
  if (!activeChat) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">💬 Messages</h1>
            <p className="text-muted text-sm mt-0.5">Real-time chats with job applicants & employers</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-20 animate-pulse bg-gray-100/70" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state card py-12 text-center space-y-3">
            <span className="text-5xl mb-2">💬</span>
            <h3 className="font-bold text-xl text-foreground">No conversations yet</h3>
            <p className="text-muted max-w-sm mx-auto">
              Message job applicants or employers to ask for details and discuss requirements in real-time.
            </p>
            <button
              onClick={() => navigate('/opportunities')}
              className="btn-primary mt-2"
              id="btn-find-work-chat"
            >
              Explore Opportunities
            </button>
          </div>
        ) : (
          <div className="card divide-y divide-border p-0 overflow-hidden shadow-card">
            {conversations.map((c) => {
              const cId = c._id || c.id || c.conversationId
              return (
                <button
                  key={cId}
                  onClick={() => setActiveChat(c)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-primary-50/70 transition-colors text-left"
                  id={`chat-${cId}`}
                >
                  {/* Avatar & Online Dot */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
                      {c.avatar || '👤'}
                    </div>
                    {c.online !== false && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online now" />
                    )}
                    {c.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center shadow-xs">
                        {c.unread}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground text-base truncate">{c.name}</p>
                      <p className="text-xs text-muted font-medium shrink-0">{c.time || '10:00 AM'}</p>
                    </div>
                    <p className="text-xs text-primary font-semibold truncate">{c.role || 'Chat'}</p>
                    <p className="text-muted text-sm truncate mt-1">{c.lastMsg || 'Tap to view conversation'}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Get opposite party's display name accurately
  const getOppositePartyName = () => {
    const myName = (currentUser.name || '').trim().toLowerCase()
    if (activeChat?.name && activeChat.name.trim().toLowerCase() !== myName) {
      return activeChat.name
    }
    for (const m of messages) {
      const sName = (m.senderName || '').trim()
      const rName = (m.recipientName || '').trim()
      if (sName && sName.toLowerCase() !== myName) return sName
      if (rName && rName.toLowerCase() !== myName) return rName
    }
    return activeChat?.recipientName || (currentUser.role === 'job_provider' ? 'Job Seeker' : 'Job Provider')
  }

  const oppositePartyName = activeChat ? getOppositePartyName() : ''

  // Active Chat Room View
  return (
    <div className="flex flex-col h-screen max-h-screen pb-20 lg:pb-0 bg-[#efeae2]/30">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10 shadow-xs">
        <button
          onClick={() => { setActiveChat(null); fetchConversations() }}
          className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch"
          aria-label="Back"
          id="btn-back-chat"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="relative">
          <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center text-xl">
            {activeChat.avatar || '👤'}
          </div>
          {activeChat.online !== false && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-base leading-tight truncate">{oppositePartyName}</p>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> Online • {activeChat.role || 'Direct Message'}
          </p>
        </div>

        <button
          onClick={() => alert(`Direct call feature with ${oppositePartyName}`)}
          className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch"
          aria-label="Call"
        >
          <Phone size={22} className="text-primary" />
        </button>
      </div>

      {/* Opportunity Context Banner (if chatting about a specific job posting) */}
      {activeChat.opportunityTitle && (
        <div className="bg-primary-50 border-b border-primary-200/60 px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-primary-900 truncate">
            <Briefcase size={16} className="text-primary shrink-0" />
            <span className="font-bold">Inquiring about:</span>
            <span className="truncate font-medium">{activeChat.opportunityTitle}</span>
          </div>
          {activeChat.opportunityId && (
            <button
              onClick={() => navigate(`/opportunities/${activeChat.opportunityId}`)}
              className="text-primary font-bold hover:underline shrink-0 text-xs flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-primary/20"
              id="btn-view-job-from-chat"
            >
              Job Details <ExternalLink size={12} />
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area - WhatsApp style (Sender on Right, Receiver on Left) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f8f9fa]">
        {messages.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-muted">
            <p className="text-4xl">💬</p>
            <p className="font-semibold text-foreground">Start the conversation</p>
            <p className="text-xs max-w-xs mx-auto">Send a message to ask about timings, requirements, and job details.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const msgId = msg._id || msg.id || msg.clientMsgId
            const myIdStr = String(currentUserId || '').trim()
            const myNameStr = String(currentUser.name || currentUserName || '').trim().toLowerCase()
            const msgSenderIdStr = String(msg.senderId || '').trim()
            const msgSenderNameStr = String(msg.senderName || '').trim().toLowerCase()
            
            // Accurate determination of whether current user is the sender
            let isMe = false
            if (msgSenderIdStr && myIdStr && msgSenderIdStr !== 'u_user' && myIdStr !== 'u_user') {
              isMe = (msgSenderIdStr === myIdStr)
            } else if (msgSenderNameStr && myNameStr) {
              isMe = (msgSenderNameStr === myNameStr)
            } else if (msg.sender === 'me') {
              isMe = true
            }

            const hasTranslation = translations[msgId]
            const isTranslating = translatingId === msgId

            return (
              <div
                key={msgId}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-base space-y-1.5 shadow-xs transition-all
                    ${
                      isMe
                        ? 'bg-primary text-white rounded-tr-none self-end'
                        : 'bg-white text-foreground border border-gray-200/80 rounded-tl-none self-start'
                    }`}
                >
                  {/* Sender Name Header for received messages (Left side only) */}
                  {!isMe && (
                    <p className="text-xs font-bold text-primary mb-0.5">
                      {msg.senderName || oppositePartyName || 'Applicant'}
                    </p>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Inline Translation Display */}
                  {hasTranslation && (
                    <div
                      className={`mt-2 pt-2 border-t text-sm ${
                        isMe ? 'border-white/30 text-emerald-100' : 'border-gray-200 text-emerald-800'
                      } bg-emerald-950/10 p-2 rounded-xl flex items-start gap-1.5`}
                    >
                      <Sparkles size={14} className="shrink-0 mt-0.5 text-emerald-500" />
                      <div>
                        <p className="font-bold text-xs opacity-90">Tamil Translation:</p>
                        <p className="font-medium text-sm leading-snug">{hasTranslation}</p>
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Ticks & Opt-In Translate Button */}
                  <div
                    className={`flex items-center justify-between gap-3 text-xs pt-0.5 ${
                      isMe ? 'text-white/80' : 'text-muted'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {msg.time || msg.timestamp || 'Now'}
                      {isMe && (
                        msg.status === 'read' ? (
                          <CheckCheck size={14} className="text-sky-300" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck size={14} className="text-white/80" />
                        ) : (
                          <Check size={14} className="text-white/60" />
                        )
                      )}
                    </span>

                    <button
                      onClick={() => handleTranslateMessage(msgId, msg.text)}
                      disabled={isTranslating}
                      className={`font-semibold underline flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors ${
                        isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-primary'
                      }`}
                      id={`translate-msg-${msgId}`}
                    >
                      <Languages size={13} />
                      {isTranslating
                        ? 'Translating...'
                        : hasTranslation
                        ? 'Original'
                        : '🌐 Translate'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Footer */}
      <div className="sticky bottom-20 lg:bottom-0 bg-white border-t border-border px-4 py-3 flex gap-3 shadow-md">
        <input
          type="text"
          className="input flex-1 text-base"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          aria-label="Message input"
          id="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="btn-primary px-5 py-3 font-bold disabled:opacity-50"
          aria-label="Send message"
          id="btn-send-message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

