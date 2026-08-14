import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Mic, X, Sparkles } from 'lucide-react'

const starterPrompts = [
  { label: '💼 What work suits me?', prompt: 'What kind of work suits someone with cooking and embroidery skills?' },
  { label: '💰 How much can I earn?', prompt: 'How much can I earn teaching cooking classes at home?' },
  { label: '📝 Help me write my profile', prompt: 'Help me write a profile description for my SilverHands account' },
  { label: '🛡️ Is this safe?', prompt: 'How do I stay safe when meeting clients for the first time?' },
]

const getAIResponse = (question) => {
  const lower = question.toLowerCase()
  if (lower.includes('earn') || lower.includes('income') || lower.includes('money')) {
    return `Based on your skills, here are some **estimated** earning ranges (actual income will vary):

🍳 **Cooking classes**: ₹300–₹1,500 per session
🧵 **Embroidery teaching**: ₹200–₹800 per session  
📝 **Recipe writing**: ₹150–₹500 per article

⚠️ These are **estimates only** based on current market data. Your actual income depends on your location, experience, and the demand in your area. SilverHands does not guarantee any specific income.

Would you like tips on how to attract your first client?`
  }
  if (lower.includes('profile') || lower.includes('write')) {
    return `Here is a sample profile description you can customize:

"Namaste! I am [Your Name], a homemaker with [X] years of experience in [your skills]. I specialize in [specific skill] and love sharing my knowledge with others.

I offer [service] at [your location] and am available on [your schedule].

I am a trustworthy, patient, and dedicated worker. I would love to help you with [what you offer]!"

✏️ Replace the parts in [ ] with your own details. Would you like me to help with anything specific?`
  }
  if (lower.includes('safe') || lower.includes('security')) {
    return `Your safety is our top priority! Here are important tips:

🔒 **Before meeting a client:**
• Always chat first through SilverHands messages
• Verify the client's profile is marked ✓ Verified
• Share your schedule with a family member

📍 **For in-person work:**
• First meeting should be in a public place
• Tell someone where you are going
• Trust your instincts — you can always say no

📞 **If something feels wrong:**
• Use the "Report" button on any profile
• Call our Safety Helpline: 1800-XXX-XXXX (toll-free)
• Block the person immediately

You are always in control. Your comfort comes first. 🙏`
  }
  return `Thank you for your question! 🙏

I am your AI assistant on SilverHands. I can help you with:
• Finding the right work for your skills
• Understanding how much you might earn (estimates only)
• Writing your profile
• Safety tips for working with clients
• Navigating the platform

**What would you like help with today?**

*Note: I am an AI assistant. For urgent safety issues, please call our helpline or contact support.*`
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Namaste! 🙏 I am your SilverHands AI Assistant.\n\nI can help you find the right work, estimate earnings, write your profile, or answer any questions. How can I help you today?`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = (text) => {
    const q = text || input
    if (!q.trim()) return
    const userMsg = { id: Date.now(), sender: 'user', text: q }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    // Simulate AI response delay
    setTimeout(() => {
      const response = getAIResponse(q)
      setMessages(m => [...m, { id: Date.now() + 1, sender: 'ai', text: response }])
      setLoading(false)
    }, 1200)
  }

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-foreground">{line.slice(2, -2)}</p>
      }
      if (line.startsWith('•')) {
        return <li key={i} className="ml-4 list-disc">{line.slice(1).trim()}</li>
      }
      return <p key={i} className={line === '' ? 'my-1' : ''}>{line}</p>
    })
  }

  return (
    <div className="flex flex-col h-screen max-h-screen pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-4 text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={28} />
          </div>
          <div>
            <h1 className="font-bold text-xl">AI Assistant</h1>
            <p className="text-sm text-white/80 flex items-center gap-1">
              <Sparkles size={14} /> Powered by Gemini AI
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Starter prompts (only when just greeting) */}
          {messages.length === 1 && (
            <div>
              <p className="text-sm text-muted mb-3 text-center">Quick questions to get started:</p>
              <div className="grid grid-cols-2 gap-2">
                {starterPrompts.map(p => (
                  <button
                    key={p.label}
                    onClick={() => sendMessage(p.prompt)}
                    className="bg-white border-2 border-border rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:border-primary hover:bg-primary-50 transition-all min-h-touch text-left"
                    id={`starter-${p.label.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.sender === 'ai' && (
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shrink-0 mt-1">
                  <Bot size={20} />
                </div>
              )}
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-base space-y-1
                ${msg.sender === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white text-foreground border border-border rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.sender === 'ai' ? (
                  <div className="prose prose-sm max-w-none">{formatText(msg.text)}</div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-3">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-4 flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2.5 h-2.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-20 lg:bottom-0 bg-white border-t border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Ask anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading}
            aria-label="Ask AI assistant"
            id="ai-input"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 disabled:opacity-50"
            aria-label="Send message"
            id="btn-ai-send"
          >
            <Send size={22} />
          </button>
        </div>
        <p className="text-xs text-muted text-center mt-2 max-w-2xl mx-auto">
          AI can make mistakes. Earnings are estimates only. Always verify important information.
        </p>
      </div>
    </div>
  )
}
