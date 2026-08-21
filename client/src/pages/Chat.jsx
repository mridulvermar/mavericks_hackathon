import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, ArrowLeft, Phone, Languages, Sparkles, CheckCheck, Check, Briefcase, ExternalLink } from 'lucide-react'
import { io } from 'socket.io-client'

import { API_BASE_URL, SOCKET_URL, api } from '../api/axios'

// Accurate localized time formatter for individual chat message bubbles
function formatMessageTime(msg) {
  const ts = msg?.createdAt || msg?.timestamp || msg?.time
  if (!ts) {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  const dateObj = new Date(ts)
  if (!isNaN(dateObj.getTime()) && (typeof ts === 'number' || String(ts).includes('T') || String(ts).includes('-') || String(ts).includes(':'))) {
    return dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  return String(msg?.time || msg?.timestamp || 'Just now')
}

// Accurate localized time formatter for conversation preview list
function formatConversationTime(conv) {
  const ts = conv?.createdAt || conv?.latestTime || conv?.timestamp || conv?.time
  if (!ts) return ''
  const dateObj = new Date(ts)
  if (isNaN(dateObj.getTime())) {
    return conv?.time || ''
  }

  const now = new Date()
  const isToday = dateObj.toDateString() === now.toDateString()
  if (isToday) {
    return dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
  return dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function Chat() {
  const navigate = useNavigate()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [translations, setTranslations] = useState({}) // msgId -> translatedText
  const [translationErrors, setTranslationErrors] = useState({}) // msgId -> error
  const [translatingId, setTranslatingId] = useState(null)

  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const activeChatRef = useRef(activeChat)
  const currentUserRef = useRef(null)

  const currentUser = JSON.parse(localStorage.getItem('sh_user') || '{}')
  const currentUserId = currentUser._id || currentUser.id || 'u_user'
  const currentUserName = currentUser.name || (currentUser.role === 'job_provider' ? 'Job Provider' : 'Job Seeker')

  currentUserRef.current = currentUser
  activeChatRef.current = activeChat

  // 1. Initialize persistent Socket.IO connection once on mount
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current.on('connect', () => {
      console.log('⚡ Socket connected to server:', socketRef.current.id)
      socketRef.current.emit('user:join', currentUserId)
      if (activeChatRef.current) {
        const activeConvId = activeChatRef.current._id || activeChatRef.current.id || activeChatRef.current.conversationId
        if (activeConvId) socketRef.current.emit('chat:join', activeConvId)
      }
    })

    // Real-time two-way message listener
    socketRef.current.on('chat:message', (newMsg) => {
      const activeConvId = activeChatRef.current?._id || activeChatRef.current?.id || activeChatRef.current?.conversationId

      // If this incoming message is for the currently open active chat
      if (
        activeConvId &&
        (newMsg.conversationId === activeConvId || (newMsg.roomId && newMsg.roomId === activeConvId))
      ) {
        setMessages((prevMsgs) => {
          // Check if message already exists (e.g. from optimistic send)
          const existingIdx = prevMsgs.findIndex((m) => {
            if (
              newMsg.clientMsgId &&
              (m.clientMsgId === newMsg.clientMsgId || m._id === newMsg.clientMsgId || m.id === newMsg.clientMsgId)
            ) {
              return true
            }
            if (
              (m._id && (m._id === newMsg._id || m._id === newMsg.id)) ||
              (m.id && (m.id === newMsg._id || m.id === newMsg.id))
            ) {
              return true
            }
            if (
              m.text === newMsg.text &&
              (String(m.senderId) === String(newMsg.senderId) ||
                (m.sender === 'me' && String(newMsg.senderId) === String(currentUserId)))
            ) {
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
              createdAt: newMsg.createdAt || updated[existingIdx].createdAt,
            }
            return updated
          }
          return [...prevMsgs, newMsg]
        })
      }

      // Always update conversation list preview and order
      setConversations((prevConvs) => {
        const convId = newMsg.conversationId || newMsg.roomId
        if (!convId) return prevConvs

        const existingIdx = prevConvs.findIndex((c) => (c._id || c.id || c.conversationId) === convId)
        const isMsgFromMe = String(newMsg.senderId) === String(currentUserId)
        const otherPartyName = isMsgFromMe
          ? newMsg.recipientName || 'Job Contact'
          : newMsg.senderName || 'Job Contact'

        if (existingIdx !== -1) {
          const updated = [...prevConvs]
          updated[existingIdx] = {
            ...updated[existingIdx],
            lastMsg: newMsg.text,
            createdAt: newMsg.createdAt || new Date().toISOString(),
            latestTime: new Date(newMsg.createdAt || Date.now()).getTime(),
            name:
              updated[existingIdx].name && updated[existingIdx].name !== currentUserName
                ? updated[existingIdx].name
                : otherPartyName,
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
            createdAt: newMsg.createdAt || new Date().toISOString(),
            latestTime: Date.now(),
            avatar: newMsg.opportunityTitle ? '💼' : '👤',
            online: true,
          }
          return [newConvItem, ...prevConvs]
        }
      })
    })

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [currentUserId])

  // Handle direct navigation via location.state (e.g. from Job Inquire / Bookings / Message button)
  useEffect(() => {
    if (location.state?.conversationId) {
      const convId = location.state.conversationId
      const targetConv = {
        _id: convId,
        id: convId,
        conversationId: convId,
        name: location.state.name || (currentUser.role === 'job_provider' ? 'Job Seeker' : 'Job Provider'),
        role:
          location.state.role ||
          (location.state.opportunityTitle ? `Job: ${location.state.opportunityTitle}` : 'Direct Message'),
        avatar: location.state.avatar || (location.state.opportunityTitle ? '💼' : '👤'),
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
          return prev.map((c) => ((c._id || c.id || c.conversationId) === convId ? { ...c, ...targetConv } : c))
        }
        return [targetConv, ...prev]
      })
    }
  }, [location.state])

  // Fetch real Conversations list from backend
  const fetchConversations = async () => {
    try {
      const res = await api.get(
        `/chat/conversations?userId=${encodeURIComponent(currentUserId)}&userName=${encodeURIComponent(currentUser.name || '')}`
      )
      if (res.data.success && Array.isArray(res.data.data)) {
        setConversations((prev) => {
          const fetchedMap = new Map(res.data.data.map((c) => [c._id || c.id || c.conversationId, c]))
          const customActive = prev.filter((c) => !fetchedMap.has(c._id || c.id || c.conversationId))
          return [...customActive, ...res.data.data]
        })
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-reload polling for conversations list when on list view
  useEffect(() => {
    fetchConversations()
    if (!activeChat) {
      const convInterval = setInterval(fetchConversations, 3000)
      return () => clearInterval(convInterval)
    }
  }, [activeChat, currentUserId])

  // Fetch Messages & join room when an Active Chat is open
  useEffect(() => {
    if (!activeChat) return

    const chatId = activeChat._id || activeChat.id || activeChat.conversationId
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:join', chatId)
    }

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/conversations/${chatId}/messages`)
        if (res.data.success && Array.isArray(res.data.data)) {
          setMessages((prev) => {
            const prevSignature = prev.map((m) => `${m._id || m.id || m.clientMsgId}_${m.text}`).join('|')
            const newSignature = res.data.data.map((m) => `${m._id || m.id || m.clientMsgId}_${m.text}`).join('|')
            if (prevSignature === newSignature) return prev
            return res.data.data
          })
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err)
      }
    }

    fetchMessages()
    // Auto-polling every 2.5 seconds for rock-solid real-time sync across both devices
    const pollInterval = setInterval(fetchMessages, 2500)
    return () => clearInterval(pollInterval)
  }, [activeChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChat])

  // Send Message handler (both Socket broadcast and REST API persistence)
  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return

    const chatId = activeChat._id || activeChat.id || activeChat.conversationId
    const textToSend = input.trim()
    setInput('')

    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const nowIso = new Date().toISOString()
    const nowTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })

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
      recipientId: activeChat.recipientId || activeChat.otherUserId || '',
      recipientName: activeChat.name || activeChat.recipientName || '',
      opportunityTitle: activeChat.opportunityTitle || null,
      opportunityId: activeChat.opportunityId || null,
      status: 'sent',
      time: nowTime,
      timestamp: nowTime,
      createdAt: nowIso,
    }

    // 1. Optimistically display in message thread immediately
    setMessages((prev) => [...prev, newMsgPayload])

    // 2. Update conversation preview in list
    setConversations((prev) => {
      const idx = prev.findIndex((c) => (c._id || c.id || c.conversationId) === chatId)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = {
          ...copy[idx],
          lastMsg: textToSend,
          createdAt: nowIso,
          latestTime: Date.now(),
        }
        return copy.sort((a, b) => (b.latestTime || 0) - (a.latestTime || 0))
      }
      return [
        {
          ...activeChat,
          lastMsg: textToSend,
          createdAt: nowIso,
          latestTime: Date.now(),
        },
        ...prev,
      ]
    })

    // 3. Real-time broadcast via Socket.IO if connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:message', newMsgPayload)
    }

    // 4. Guaranteed persist via Backend REST API
    try {
      const res = await api.post('/chat/messages', newMsgPayload)
      if (res.data.success && res.data.data) {
        const saved = res.data.data
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId || m.clientMsgId === tempId
              ? {
                  ...m,
                  ...saved,
                  _id: String(saved._id || saved.id || tempId),
                  id: String(saved._id || saved.id || tempId),
                  status: 'delivered',
                  sender: 'me',
                }
              : m
          )
        )
      }
    } catch (err) {
      console.error('API Send message error:', err)
    }
  }

  // Per-Message Opt-In AI Translation Handler (Tamil)
  const handleTranslateMessage = async (msgId, text) => {
    if (translations[msgId]) {
      setTranslations((prev) => {
        const copy = { ...prev }
        delete copy[msgId]
        return copy
      })
      setTranslationErrors((prev) => {
        const c = { ...prev }
        delete c[msgId]
        return c
      })
      return
    }

    setTranslatingId(msgId)
    setTranslationErrors((prev) => {
      const c = { ...prev }
      delete c[msgId]
      return c
    })
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

  // Conversation Partner Display Name
  const getOppositePartyName = () => {
    const myName = (currentUser.name || '').trim().toLowerCase()
    const myId = String(currentUserId || '').trim()

    if (activeChat?.recipientName && activeChat.recipientName.trim().toLowerCase() !== myName) {
      return activeChat.recipientName
    }
    if (activeChat?.name && activeChat.name.trim().toLowerCase() !== myName) {
      return activeChat.name
    }

    for (const m of messages) {
      const sId = String(m.senderId || '').trim()
      const rId = String(m.recipientId || '').trim()
      const sName = (m.senderName || '').trim()
      const rName = (m.recipientName || '').trim()

      if (sId && sId !== myId && sName && sName.toLowerCase() !== myName) return sName
      if (rId && rId !== myId && rName && rName.toLowerCase() !== myName) return rName
      if (sName && sName.toLowerCase() !== myName) return sName
      if (rName && rName.toLowerCase() !== myName) return rName
    }
    return activeChat?.recipientName || (currentUser.role === 'job_provider' ? 'Job Seeker' : 'Job Provider')
  }

  const oppositePartyName = activeChat ? getOppositePartyName() : ''

  // ── Conversation List View ─────────────────────────────────────────
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
            <button onClick={() => navigate('/opportunities')} className="btn-primary mt-2" id="btn-find-work-chat">
              Explore Opportunities
            </button>
          </div>
        ) : (
          <div className="card divide-y divide-border p-0 overflow-hidden shadow-card">
            {conversations.map((c) => {
              const cId = c._id || c.id || c.conversationId
              const displayTime = formatConversationTime(c)

              return (
                <button
                  key={cId}
                  onClick={() => setActiveChat(c)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-primary-50/70 transition-colors text-left"
                  id={`chat-${cId}`}
                >
                  {/* Avatar & Online Badge */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
                      {c.avatar || '👤'}
                    </div>
                    {c.online !== false && (
                      <span
                        className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"
                        title="Online now"
                      />
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
                      <p className="text-xs text-muted font-medium shrink-0">{displayTime}</p>
                    </div>
                    <p className="text-xs text-primary font-semibold truncate">{c.role || 'Direct Message'}</p>
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

  // ── Active Chat Room View ─────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen max-h-screen pb-20 lg:pb-0 bg-[#efeae2]/30">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10 shadow-xs">
        <button
          onClick={() => {
            setActiveChat(null)
            fetchConversations()
          }}
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
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> Online •{' '}
            {activeChat.role || 'Direct Message'}
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
            <p className="text-xs max-w-xs mx-auto">
              Send a message to ask about timings, requirements, and job details.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const msgId = msg._id || msg.id || msg.clientMsgId
            const myIdStr = String(currentUserId || '').trim()
            const myNameStr = String(currentUser.name || currentUserName || '').trim().toLowerCase()
            const msgSenderIdStr = String(msg.senderId || '').trim()
            const msgSenderNameStr = String(msg.senderName || '').trim().toLowerCase()

            // Dynamic determination of whether current user is the sender
            let isMe = false
            if (msgSenderIdStr && myIdStr && msgSenderIdStr !== 'u_user' && myIdStr !== 'u_user') {
              isMe = msgSenderIdStr === myIdStr
            } else if (msgSenderNameStr && myNameStr) {
              isMe = msgSenderNameStr === myNameStr
            } else if (msg.sender === 'me') {
              isMe = true
            }

            const hasTranslation = translations[msgId]
            const isTranslating = translatingId === msgId
            const messageTimeString = formatMessageTime(msg)

            return (
              <div key={msgId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
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
                      {msg.senderName || oppositePartyName || 'Contact'}
                    </p>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Inline Tamil Translation Display */}
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
                      {messageTimeString}
                      {isMe &&
                        (msg.status === 'read' ? (
                          <CheckCheck size={14} className="text-sky-300" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck size={14} className="text-white/80" />
                        ) : (
                          <Check size={14} className="text-white/60" />
                        ))}
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
                      {isTranslating ? 'Translating...' : hasTranslation ? 'Original' : '🌐 Translate'}
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
