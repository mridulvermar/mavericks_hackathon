import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, Phone, Languages, Sparkles, CheckCheck } from 'lucide-react'
import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export default function Chat() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [translations, setTranslations] = useState({}) // msgId -> translatedText
  const [translatingId, setTranslatingId] = useState(null)

  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  // Initialize Socket.IO
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      console.log('⚡ Socket connected to server')
      socketRef.current.emit('user:join', 'user_sunita')
    })

    socketRef.current.on('chat:message', (newMsg) => {
      setMessages((prevMsgs) => {
        // Prevent duplicate messages if already appended
        if (prevMsgs.some((m) => (m._id || m.id) === (newMsg._id || newMsg.id))) {
          return prevMsgs
        }
        return [...prevMsgs, newMsg]
      })
    })

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  // Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/chat/conversations`)
        const data = await res.json()
        if (data.success && data.data) {
          setConversations(data.data)
        }
      } catch (err) {
        console.error('Error fetching conversations:', err)
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
          setMessages(data.data)
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

    const tempMsg = {
      _id: String(Date.now()),
      id: String(Date.now()),
      conversationId: chatId,
      text: textToSend,
      sender: 'me',
      senderName: 'Sunita Ji',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, tempMsg])

    // Broadcast via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('chat:message', {
        roomId: chatId,
        conversationId: chatId,
        text: textToSend,
        senderId: 'me',
        senderName: 'Sunita Ji',
      })
    }

    // HTTP Persistence Fallback
    try {
      await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: chatId,
          text: textToSend,
          senderName: 'Sunita Ji',
        }),
      })
    } catch (err) {
      console.error('HTTP Send fallback error:', err)
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
      return
    }

    setTranslatingId(msgId)
    try {
      const res = await fetch(`${API_BASE_URL}/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: 'ta',
        }),
      })
      const data = await res.json()
      if (data.success && data.translatedText) {
        setTranslations((prev) => ({
          ...prev,
          [msgId]: data.translatedText,
        }))
      }
    } catch (err) {
      console.error('Translation error:', err)
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
          const isMe = msg.sender === 'me'
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

                {/* Timestamp & Opt-In Translate Button */}
                <div
                  className={`flex items-center justify-between gap-3 text-xs pt-1 ${
                    isMe ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {msg.time || 'Now'}
                    {isMe && <CheckCheck size={14} />}
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
