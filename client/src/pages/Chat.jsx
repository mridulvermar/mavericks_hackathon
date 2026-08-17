import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, ArrowLeft, Phone, Languages, Sparkles, CheckCheck, Check } from 'lucide-react'
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

  // Initialize Socket.IO
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('sh_user') || '{}')
    const userId = user._id || user.id || 'u_user'

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      console.log('⚡ Socket connected to server')
      socketRef.current.emit('user:join', userId)
    })

    socketRef.current.on('chat:message', (newMsg) => {
      setMessages((prevMsgs) => {
        // Robust check to match existing message
        const existingIdx = prevMsgs.findIndex((m) => {
          if (newMsg.clientMsgId && (m.clientMsgId === newMsg.clientMsgId || m._id === newMsg.clientMsgId || m.id === newMsg.clientMsgId)) {
            return true
          }
          if ((m._id && (m._id === newMsg._id || m._id === newMsg.id)) || (m.id && (m.id === newMsg._id || m.id === newMsg.id))) {
            return true
          }
          // Match identical text from same sender sent within last 5 seconds
          if ((m.senderId && m.senderId === newMsg.senderId) || (m.sender === 'me' && newMsg.senderId === userId)) {
            if (m.text === newMsg.text) {
              return true
            }
          }
          return false
        })

        if (existingIdx !== -1) {
          const updated = [...prevMsgs]
          updated[existingIdx] = {
            ...updated[existingIdx],
            _id: newMsg._id || updated[existingIdx]._id,
            id: newMsg._id || updated[existingIdx].id,
            status: newMsg.status || 'delivered',
            time: newMsg.timestamp || newMsg.time || updated[existingIdx].time,
          }
          return updated
        }
        return [...prevMsgs, newMsg]
      })
    })

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  // Handle direct navigation via location.state (e.g. from Message button on applications/bookings)
  useEffect(() => {
    if (location.state?.conversationId) {
      const convId = location.state.conversationId
      const targetConv = {
        _id: convId,
        id: convId,
        name: location.state.name || 'Connected User',
        role: location.state.role || 'Direct Message',
        avatar: location.state.avatar || '💬',
        online: true,
      }
      setActiveChat(targetConv)
      setConversations(prev => {
        if (prev.some(c => (c._id || c.id) === convId)) return prev
        return [targetConv, ...prev]
      })
    }
  }, [location.state])

  // Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true)
      setFetchError(false)
      try {
        const res = await fetch(`${API_BASE_URL}/chat/conversations`)
        const data = await res.json()
        if (data.success && data.data) {
          setConversations(prev => {
            const existingIds = new Set(data.data.map(c => c._id || c.id))
            const customConvs = prev.filter(c => !existingIds.has(c._id || c.id))
            return [...customConvs, ...data.data]
          })
        }
      } catch (err) {
        console.error('Error fetching conversations:', err)
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  // Fetch Messages when Active Chat changes
  useEffect(() => {
    if (!activeChat) return

    const chatId = activeChat._id || activeChat.id || 'c1'
    if (socketRef.current) {
      socketRef.current.emit('chat:join', chatId)
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/chat/conversations/${chatId}/messages`)
        const data = await res.json()
        if (data.success && data.data) {
          // Deduplicate incoming list
          const seen = new Set()
          const uniqueList = []
          for (const m of data.data) {
            const idKey = String(m._id || m.id || '')
            const contentKey = `${m.text}_${m.time || m.timestamp}`
            if (!seen.has(idKey) && !seen.has(contentKey)) {
              if (idKey) seen.add(idKey)
              seen.add(contentKey)
              uniqueList.push(m)
            }
          }
          setMessages(uniqueList)
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err)
      }
    }
    fetchMessages()
  }, [activeChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChat])

  // Send Message
  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return

    const chatId = activeChat._id || activeChat.id || 'c1'
    const textToSend = input.trim()
    setInput('')

    const currentUser = JSON.parse(localStorage.getItem('sh_user') || '{}')
    const currentName = currentUser.name || 'Sunita Ji'
    const currentId = currentUser._id || currentUser.id || 'u_user'
    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const tempMsg = {
      _id: tempId,
      id: tempId,
      clientMsgId: tempId,
      conversationId: chatId,
      text: textToSend,
      senderId: currentId,
      sender: 'me',
      senderName: currentName,
      status: 'sent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }

    // Optimistically add once to messages
    setMessages((prev) => [...prev, tempMsg])

    // Real-time broadcast via Socket.IO
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:message', {
        clientMsgId: tempId,
        roomId: chatId,
        conversationId: chatId,
        text: textToSend,
        senderId: currentId,
        senderName: currentName,
      })
    } else {
      // Fallback only if socket disconnected
      try {
        const res = await fetch(`${API_BASE_URL}/chat/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientMsgId: tempId,
            conversationId: chatId,
            text: textToSend,
            senderName: currentName,
            senderId: currentId,
          }),
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
      // Toggle off translation if already translated
      setTranslations((prev) => {
        const copy = { ...prev }
        delete copy[msgId]
        return copy
      })
      setTranslationErrors((prev) => { const c = {...prev}; delete c[msgId]; return c })
      return
    }

    setTranslatingId(msgId)
    setTranslationErrors((prev) => { const c = {...prev}; delete c[msgId]; return c })
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
            <p className="text-muted text-sm mt-0.5">Real-time chats with clients & employers</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-20 animate-pulse bg-gray-100/70" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state card py-12">
            <span className="text-5xl mb-2">💬</span>
            <h3 className="font-bold text-xl text-foreground">No conversations yet</h3>
            <p className="text-muted">Apply for work or list services to chat with clients.</p>
            <button
              onClick={() => navigate('/opportunities')}
              className="btn-primary mt-2"
              id="btn-find-work-chat"
            >
              Find Work
            </button>
          </div>
        ) : (
          <div className="card divide-y divide-border p-0 overflow-hidden shadow-card">
            {conversations.map((c) => {
              const cId = c._id || c.id
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
                      <p className="font-bold text-foreground text-base">{c.name}</p>
                      <p className="text-xs text-muted font-medium">{c.time || '10:00 AM'}</p>
                    </div>
                    <p className="text-xs text-primary font-semibold truncate">{c.role || 'Client'}</p>
                    <p className="text-muted text-sm truncate mt-1">{c.lastMsg || 'Tap to view messages'}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Active Chat Room View
  return (
    <div className="flex flex-col h-screen max-h-screen pb-20 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10 shadow-xs">
        <button
          onClick={() => setActiveChat(null)}
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

        <div className="flex-1">
          <p className="font-bold text-foreground text-base leading-tight">{activeChat.name}</p>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> Online
          </p>
        </div>

        <button
          onClick={() => alert(`Call feature placeholder for ${activeChat.name}`)}
          className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch"
          aria-label="Call"
        >
          <Phone size={22} className="text-primary" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background">
        {messages.map((msg) => {
          const msgId = msg._id || msg.id
          const currentUser = JSON.parse(localStorage.getItem('sh_user') || '{}')
          const currentUserId = currentUser._id || currentUser.id || 'me'
          const isMe = msg.senderId === currentUserId || msg.sender === 'me'
          const hasTranslation = translations[msgId]
          const isTranslating = translatingId === msgId

          return (
            <div
              key={msgId}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[82%] px-4 py-3 rounded-2xl text-base space-y-1.5 shadow-xs
                  ${isMe ? 'bg-primary text-white rounded-br-xs' : 'bg-white text-foreground border border-border rounded-bl-xs'}`}
              >
                <p className="leading-relaxed">{msg.text}</p>

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
                  className={`flex items-center justify-between gap-3 text-xs pt-1 ${
                    isMe ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {msg.time || msg.timestamp || 'Now'}
                    {isMe && (
                      msg.status === 'read' ? (
                        <CheckCheck size={14} className="text-sky-300" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck size={14} className="text-white/70" />
                      ) : (
                        <Check size={14} className="text-white/50" />
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
        })}
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
