import React, { useState } from 'react'
import { TrendingUp, Download, IndianRupee, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const earningsData = [
  { month: 'Mar', amount: 1800 },
  { month: 'Apr', amount: 2400 },
  { month: 'May', amount: 2100 },
  { month: 'Jun', amount: 3200 },
  { month: 'Jul', amount: 2800 },
  { month: 'Aug', amount: 3200 },
]

const recentTransactions = [
  { id: 't1', title: 'Cooking Class — Priya Mehta', date: 'Today', amount: '+₹500', type: 'credit' },
  { id: 't2', title: 'Embroidery Work — Anita Singh', date: 'Yesterday', amount: '+₹800', type: 'credit' },
  { id: 't3', title: 'Withdrawal to Bank', date: 'Aug 12', amount: '-₹2,000', type: 'debit' },
  { id: 't4', title: 'Hindi Tutoring — Rahul Kumar', date: 'Aug 10', amount: '+₹400', type: 'credit' },
]

export default function Earnings() {
  const [period, setPeriod] = useState('6M')

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp size={28} className="text-primary" /> Earnings
        </h1>
        <button className="btn-secondary py-2 px-4 text-sm" id="btn-download-statement">
          <Download size={18} /> Statement
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-accent-50 border border-accent-200 rounded-xl px-4 py-3 text-sm text-accent-700">
        ⚠️ All earnings figures are <strong>estimated</strong> based on completed work. Actual bank transfers may differ.
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'This Month (Est.)', value: '₹3,200', change: '+14%', up: true, icon: '💰' },
          { label: 'Total Earned (Est.)', value: '₹15,700', change: 'All time', up: null, icon: '🏆' },
          { label: 'Pending Payout', value: '₹1,300', change: 'Releases Fri', up: null, icon: '⏳' },
          { label: 'Jobs This Month', value: '6', change: '+2 vs last', up: true, icon: '✅' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{s.icon}</span>
              {s.up !== null && (
                s.up
                  ? <span className="text-xs text-success flex items-center gap-0.5"><ArrowUpRight size={14} />{s.change}</span>
                  : <span className="text-xs text-error flex items-center gap-0.5"><ArrowDownRight size={14} />{s.change}</span>
              )}
              {s.up === null && <span className="text-xs text-muted">{s.change}</span>}
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{s.value}</p>
            <p className="text-sm text-muted leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-foreground">Monthly Earnings <span className="text-sm font-normal text-muted">(Estimated)</span></h2>
          <div className="flex gap-1">
            {['3M', '6M', '1Y'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all min-h-[36px]
                  ${period === p ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}
                id={`period-${p}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={earningsData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} tickFormatter={v => `₹${v}`} width={55} />
            <Tooltip
              formatter={(v) => [`₹${v} (Est.)`, 'Earnings']}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e5e0d5', fontSize: '14px' }}
            />
            <Bar dataKey="amount" fill="#1e7c1e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-4">Recent Transactions</h2>
        <div className="divide-y divide-border">
          {recentTransactions.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-foreground text-base">{t.title}</p>
                <p className="text-sm text-muted">{t.date}</p>
              </div>
              <span className={`font-bold text-lg ${t.type === 'credit' ? 'text-success' : 'text-error'}`}>
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw */}
      <button
        onClick={() => alert('Withdrawal request submitted! (Demo mode — Razorpay integration in Step 5)')}
        className="btn-primary w-full text-lg py-4"
        id="btn-withdraw"
      >
        <IndianRupee size={22} /> Withdraw to Bank Account
      </button>
    </div>
  )
}
