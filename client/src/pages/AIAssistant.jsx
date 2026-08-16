import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Send, Sparkles, ArrowRight, ShieldAlert, DollarSign, Briefcase, ShoppingBag } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'

const quickActionButtons = [
  {
    label: '🍳 Find Cooking Opportunities',
    prompt: 'Show me cooking opportunities nearby',
    action: 'navigate',
    target: '/opportunities?category=Cooking',
    icon: Briefcase,
    color: 'bg-primary-50 border-primary-200 text-primary-900',
  },
  {
    label: '🧵 Create Cooking / Tailoring Service',
    prompt: 'How do I list my service on the marketplace?',
    action: 'navigate',
    target: '/marketplace',
    icon: ShoppingBag,
    color: 'bg-purple-50 border-purple-200 text-purple-900',
  },
  {
    label: '💰 How Much Can I Earn?',
    prompt: 'How much can I earn teaching cooking or tailoring at home?',
    action: 'chat',
    icon: DollarSign,
    color: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  {
    label: '🛡️ Safety & Helpline Guidance',
    prompt: 'What safety rules should I follow when meeting clients?',
    action: 'chat',
    icon: ShieldAlert,
    color: 'bg-blue-50 border-blue-200 text-blue-900',
  },
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Namaste! 🙏 I am **SilverAI**, your friendly livelihood assistant on SilverHands.\n\nI am here to help senior citizens and homemakers find work, sell traditional food & craft products, estimate earnings, and stay safe. How can I help you today?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleQuickAction = (btn) => {
    if (btn.action === 'navigate') {
      navigate(btn.target)
    } else {
      sendMessage(btn.prompt)
    }
  }

  const sendMessage = async (textToSubmit) => {
    const q = textToSubmit || input
    if (!q || !q.trim()) return

    const userMsg = { id: String(Date.now()), sender: 'user', text: q }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      })
      const data = await res.json()
      if (data.success && data.response) {
        setMessages((m) => [...m, { id: String(Date.now() + 1), sender: 'ai', text: data.response }])
      } else {
        setMessages((m) => [
          ...m,
          {
            id: String(Date.now() + 1),
            sender: 'ai',
            text: `Namaste! 🙏 I am here to help you find cooking, tailoring, or tutoring work. All earnings are estimated based on local market data.`,
          },
        ])
      }
    } catch (err) {
      console.error('SilverAI assistant error:', err)
      setMessages((m) => [
        ...m,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `Namaste! 🙏 I am here to help you navigate SilverHands. Try exploring opportunities or listing services on the marketplace!`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-bold text-foreground my-1">
            {line.slice(2, -2)}
          </p>
        )
      }
      if (line.startsWith('•')) {
        return (
          <li key={i} className="ml-4 list-disc text-sm">
            {line.slice(1).trim()}
          </li>
        )
      }
      return <p key={i} className={line === '' ? 'my-1' : 'text-sm leading-relaxed'}>{line}</p>
    })
  }

  return (
    <div className="flex flex-col h-screen max-h-screen pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 px-4 py-4 text-white shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0">
              <Bot size={28} />
            </div>
            <div>
              <h1 className="font-extrabold text-xl flex items-center gap-2">
                SilverAI <span className="badge bg-white/20 text-white text-xs">Assistant</span>
              </h1>
              <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5">
                <Sparkles size={14} className="text-accent" /> Friendly Livelihood & Safety Companion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Body */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Starter Quick-Reply Action Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted text-center uppercase tracking-wider">
              Quick Actions & Pre-filled Navigation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActionButtons.map((btn, idx) => {
                const IconComponent = btn.icon
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(btn)}
                    className={`border-2 rounded-2xl p-3 text-sm font-semibold flex items-center justify-between transition-all hover:shadow-card ${btn.color}`}
                    id={`quick-action-${idx}`}
                  >
                    <span className="flex items-center gap-2 text-left">{btn.label}</span>
                    <ArrowRight size={16} className="shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
            >
              {msg.sender === 'ai' && (
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-xs">
                  <Bot size={20} />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-base space-y-1.5 shadow-sm
                  ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-white text-foreground border border-border rounded-bl-xs'
                  }`}
              >
                {msg.sender === 'ai' ? (
                  <div className="prose prose-sm max-w-none">{formatText(msg.text)}</div>
                ) : (
                  <p className="text-base">{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-3">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-border rounded-2xl rounded-bl-xs px-4 py-4 flex gap-1.5 shadow-xs">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Form Footer */}
      <div className="sticky bottom-20 lg:bottom-0 bg-white border-t border-border px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            className="input flex-1 text-base"
            placeholder="Ask SilverAI anything (e.g. how much can I earn cooking?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
            aria-label="Ask SilverAI assistant"
            id="ai-input"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-5 font-bold disabled:opacity-50"
            aria-label="Send message"
            id="btn-ai-send"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-muted text-center mt-2 max-w-2xl mx-auto">
          SilverAI earnings figures are estimated. Always follow safety guidelines when meeting new clients.
        </p>
      </div>
    </div>
  )
}
