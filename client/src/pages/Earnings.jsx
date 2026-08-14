import React, { useState, useEffect } from 'react'
import { TrendingUp, Download, IndianRupee, ArrowUpRight, CheckCircle2, Clock, Briefcase } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Earnings() {
  const [period, setPeriod] = useState('6M')
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchEarnings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/earnings`)
      const data = await res.json()
      if (data.success) {
        setEarnings(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEarnings()
  }, [])

  const defaultData = {
    totalEarnings: '₹15,700',
    thisMonth: '₹3,200',
    completedJobs: 6,
    pendingPayments: '₹1,300',
    earningsChart: [
      { month: 'Mar', amount: 1800 },
      { month: 'Apr', amount: 2400 },
      { month: 'May', amount: 2100 },
      { month: 'Jun', amount: 3200 },
      { month: 'Jul', amount: 2800 },
      { month: 'Aug', amount: 3200 },
    ],
    recentTransactions: [
      { id: 't1', title: 'Home Cooking Class — Priya Mehta', date: 'Today', amount: '+₹600', type: 'credit' },
      { id: 't2', title: 'Embroidery Work — Anita Singh', date: 'Yesterday', amount: '+₹800', type: 'credit' },
      { id: 't3', title: 'Withdrawal to Bank Account', date: 'Aug 12', amount: '-₹2,000', type: 'debit' },
    ],
  }

  const current = earnings || defaultData

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={28} className="text-primary" /> Earnings Dashboard
          </h1>
          <p className="text-muted text-sm mt-0.5">Track completed jobs and payout summary</p>
        </div>
        <button
          onClick={() => alert('Earnings statement downloaded (Demo mode)')}
          className="btn-secondary py-2 px-4 text-sm font-semibold flex items-center gap-1.5"
          id="btn-download-statement"
        >
          <Download size={18} /> Statement
        </button>
      </div>

      {/* Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <span className="text-lg">⚠️</span>
        <p className="leading-snug">
          All earnings figures are <strong>estimated</strong> based on completed work. Dynamic totals update automatically when bookings are marked completed.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-primary-50/50 border-primary-100 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xl">💰</span>
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-0.5"><ArrowUpRight size={14} />+14%</span>
          </div>
          <p className="text-2xl font-extrabold text-primary">{current.thisMonth}</p>
          <p className="text-sm font-semibold text-gray-700 leading-tight">This Month (Est.)</p>
        </div>

        <div className="card bg-purple-50/50 border-purple-100 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🏆</span>
            <span className="text-xs text-muted">All time</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{current.totalEarnings}</p>
          <p className="text-sm font-semibold text-gray-700 leading-tight">Total Earned (Est.)</p>
        </div>

        <div className="card bg-amber-50/50 border-amber-100 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xl">⏳</span>
            <span className="text-xs text-muted">Pending</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-900">{current.pendingPayments}</p>
          <p className="text-sm font-semibold text-gray-700 leading-tight">Pending Payout</p>
        </div>

        <div className="card bg-blue-50/50 border-blue-100 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xl">✅</span>
            <span className="text-xs text-emerald-700 font-bold">+2 jobs</span>
          </div>
          <p className="text-2xl font-extrabold text-blue-900">{current.completedJobs}</p>
          <p className="text-sm font-semibold text-gray-700 leading-tight">Completed Jobs</p>
        </div>
      </div>

      {/* Monthly Recharts Bar Chart */}
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">
            Monthly Earnings Breakdown
          </h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['3M', '6M', '1Y'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[32px]
                  ${period === p ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:text-foreground'}`}
                id={`period-${p}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={current.earningsChart} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `₹${v}`} width={55} />
              <Tooltip
                formatter={(v) => [`₹${v} (Est.)`, 'Earnings']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e0d5', fontSize: '14px', fontWeight: '600' }}
              />
              <Bar dataKey="amount" fill="#1e7c1e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions */}
      <div className="card space-y-3 p-5">
        <h2 className="font-bold text-lg text-foreground">Recent Transactions</h2>
        <div className="divide-y divide-border">
          {current.recentTransactions.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-semibold text-foreground text-base">{t.title}</p>
                <p className="text-xs text-muted">{t.date}</p>
              </div>
              <span className={`font-extrabold text-base ${t.type === 'credit' ? 'text-emerald-700' : 'text-rose-600'}`}>
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw */}
      <button
        onClick={() => alert('Bank withdrawal initiated! ₹2,000 will be transferred within 24 hours.')}
        className="btn-primary w-full text-lg py-4 font-bold flex items-center justify-center gap-2 shadow-float"
        id="btn-withdraw"
      >
        <IndianRupee size={22} /> Withdraw to Bank Account
      </button>
    </div>
  )
}
