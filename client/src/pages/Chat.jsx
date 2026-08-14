import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, Phone, MoreVertical, Smile } from 'lucide-react'

const mockConversations = [
  { id: 'c1', name: 'Priya Mehta', lastMsg: 'Great! See you tomorrow at 4pm 😊', time: '2:30 PM', unread: 2, avatar: '👩' },
  { id: 'c2', name: 'Rahul Kumar', lastMsg: 'Can you teach me rajasthani cooking?', time: '11:00 AM', unread: 0, avatar: '👨' },
  { id: 'c3', name: 'Anita Singh', lastMsg: 'How much do you charge per session?', time: 'Yesterday', unread: 1, avatar: '👩‍💼' },
]

const mockMessages = [
  { id: 1, text: 'Namaste! I saw your cooking class listing.', sender: 'other', time: '10:00 AM' },
  { id: 2, text: 'Namaste Ji! Yes, I teach traditional Rajasthani cooking.', sender: 'me', time: '10:05 AM' },
  { id: 3, text: 'How much do you charge per session?', sender: 'other', time: '10:06 AM' },
  { id: 4, text: '₹500 per session of 2 hours. Includes all ingredients.', sender: 'me', time: '10:10 AM' },
  { id: 5, text: 'That sounds wonderful! Can we book for Sunday?', sender: 'other', time: '10:12 AM' },
]

export default function Chat() {
  const navigate = useNavigate()
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState(mockMessages)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChat])

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(m => [...m, { id: Date.now(), text: input, sender: 'me', time: 'Now' }])
    setInput('')
  }

  if (!activeChat) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-foreground">💬 Messages</h1>

        {mockConversations.length === 0 ? (
          <div className="empty-state">
            <span className="text-5xl">💬</span>
            <h3 className="font-bold text-xl text-foreground">No conversations yet</h3>
            <p className="text-muted">Apply to opportunities to start chatting with clients</p>
            <button onClick={() => navigate('/opportunities')} className="btn-primary" id="btn-find-work-chat">Find Work</button>
          </div>
        ) : (
          <div className="card divide-y divide-border p-0 overflow-hidden">
            {mockConversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveChat(c)}
                className="w-full flex items-center gap-4 p-4 hover:bg-primary-50 transition-colors text-left"
                id={`chat-${c.id}`}
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl">{c.avatar}</div>
                  {c.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted">{c.time}</p>
                  </div>
                  <p className="text-muted text-sm truncate mt-0.5">{c.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Active chat view
  return (
    <div className="flex flex-col h-screen max-h-screen pb-20 lg:pb-0">
      {/* Chat Header */}
      <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => setActiveChat(null)} className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Back" id="btn-back-chat">
          <ArrowLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-xl">{activeChat.avatar}</div>
        <div className="flex-1">
          <p className="font-bold text-foreground">{activeChat.name}</p>
          <p className="text-xs text-primary">Active now</p>
        </div>
        <button className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Call"><Phone size={22} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-base
              ${msg.sender === 'me'
                ? 'bg-primary text-white rounded-br-sm'
                : 'bg-white text-foreground border border-border rounded-bl-sm shadow-sm'
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-muted'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-20 lg:bottom-0 bg-white border-t border-border px-4 py-3 flex gap-3">
        <input
          type="text"
          className="input flex-1"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          aria-label="Message input"
          id="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="btn-primary px-4 py-3 disabled:opacity-50"
          aria-label="Send message"
          id="btn-send-message"
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  )
}
