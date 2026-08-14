# 🤲 SilverHands — AI-Powered Digital Livelihood Platform

> Empowering senior citizens and homemakers in India to earn meaningful income through their skills and wisdom.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (optional — app runs in demo mode without it)

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd mavericks_hackathon
```

### 2. Setup the Server

```bash
cd server
cp .env.example .env         # Copy environment file
# Edit .env and add your API keys (all optional for demo)
npm install
npm run dev                  # Starts on http://localhost:5000
```

### 3. Setup the Client

```bash
cd client
cp .env.example .env         # Copy environment file
npm install
npm run dev                  # Starts on http://localhost:5173
```

### 4. Open the App

Visit **http://localhost:5173** — tap "Get Started" to demo the full app.

---

## 🌐 Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ Yes | Server port (default: 5000) |
| `CLIENT_URL` | ✅ Yes | Frontend URL for CORS |
| `JWT_SECRET` | ✅ Yes | Secret for JWT signing |
| `MONGODB_URI` | ⚠️ Recommended | MongoDB connection string. App runs in demo mode without this. |
| `GEMINI_API_KEY` | 🟡 Optional | Google Gemini API. AI features use rule-based fallback without this. |
| `GOOGLE_SPEECH_KEY` | 🟡 Optional | Voice input degrades to text-only input without this. |
| `GOOGLE_TRANSLATE_KEY` | 🟡 Optional | Translation features disabled without this. |
| `GOOGLE_MAPS_KEY` | 🟡 Optional | Location features use text input without this. |
| `RAZORPAY_KEY_ID` | 🟡 Optional | Payments show demo message without this. |
| `RAZORPAY_KEY_SECRET` | 🟡 Optional | Required alongside Key ID. |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ Yes | Backend API URL |
| `VITE_GEMINI_API_KEY` | 🟡 Optional | For client-side AI (server key preferred) |
| `VITE_GOOGLE_MAPS_KEY` | 🟡 Optional | Maps embed key |
| `VITE_RAZORPAY_KEY_ID` | 🟡 Optional | Payment gateway |

---

## 📁 Project Structure

```
mavericks_hackathon/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # 17 app pages
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyProfile.jsx
│   │   │   ├── AISkillDiscovery.jsx
│   │   │   ├── Opportunities.jsx
│   │   │   ├── OpportunityDetail.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Bookings.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Earnings.jsx
│   │   │   ├── AIAssistant.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── HelpSafety.jsx
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── AppShell.jsx  # Nav shell
│   │   ├── App.jsx           # Router
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles + design tokens
│   ├── tailwind.config.js    # Design tokens
│   └── vite.config.js
│
├── server/                   # Node + Express backend
│   └── src/
│       ├── index.js          # Server entry point
│       ├── config/
│       │   └── db.js         # MongoDB connection
│       ├── middleware/
│       │   ├── auth.js       # JWT middleware
│       │   └── errorHandler.js
│       ├── models/
│       │   └── User.js       # Mongoose models
│       ├── routes/
│       │   ├── health.js
│       │   ├── auth.js
│       │   ├── users.js
│       │   ├── opportunities.js
│       │   ├── bookings.js
│       │   ├── chat.js
│       │   └── ai.js
│       └── socket/
│           └── index.js      # Socket.IO setup
│
└── README.md
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Primary | `#1e7c1e` (Deep Green) | Buttons, links, accents |
| Background | `#faf8f3` (Soft Cream) | Page background |
| Accent | `#f59e0b` (Saffron Gold) | Highlights, badges |
| Text | `#1a1a1a` (Near Black) | Body copy |
| Base font | 18px | Senior-friendly |
| Min touch target | 44×44px | Accessibility |

---

## 🛡️ Safety & Ethics

- AI earnings estimates are always labeled **"Estimated"**
- No fake reviews or false verification claims
- Safety helpline prominently displayed
- All errors shown as friendly messages — never raw errors
- Every list has a helpful empty state

---

## 🏗️ Built for

**Hackathon:** 12-hour MVP  
**Stack:** React + Vite, Tailwind CSS, Node.js + Express, MongoDB, Google Gemini, Socket.IO  
**Team:** Mavericks
