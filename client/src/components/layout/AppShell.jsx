import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { t } from '../../utils/translator.js'
import {
  Home,
  Briefcase,
  ShoppingBag,
  Calendar,
  User,
  Bot,
  MessageSquare,
  TrendingUp,
  Zap,
  Menu,
  X,
  Bell,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react'
import authAPI from '../../api/auth'
import { API_BASE_URL } from '../../api/axios'



function NavItem({ to, label, icon: Icon, onClick, collapsed, badgeCount }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 min-h-touch font-medium text-base
         ${isActive
           ? 'bg-primary-100 text-primary font-semibold'
           : 'text-foreground hover:bg-primary-50 hover:text-primary'
         }
         ${collapsed ? 'justify-center px-2' : ''}
        `
      }
      aria-label={label}
    >
      <div className="flex items-center gap-3">
        <Icon size={24} strokeWidth={2} className="shrink-0" />
        {!collapsed && <span>{label}</span>}
      </div>
      {badgeCount > 0 && (
        <span className="bg-accent text-white text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
          {badgeCount}
        </span>
      )}
    </NavLink>
  )
}

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()

  const storedUser = JSON.parse(localStorage.getItem('sh_user') || '{}')
  const currentLang = storedUser.preferredLanguage || 'English'
  const isJobProvider = storedUser.role === 'job_provider' || storedUser.role === 'customer'

  const mainNavItems = isJobProvider
    ? [
        { to: '/home', label: t('Home', currentLang), icon: Home },
        { to: '/my-postings', label: t('My Postings', currentLang), icon: Briefcase },
        { to: '/marketplace', label: t('Services', currentLang), icon: ShoppingBag },
        { to: '/bookings', label: t('Bookings', currentLang), icon: Calendar },
        { to: '/profile', label: t('Profile', currentLang), icon: User },
      ]
    : [
        { to: '/home', label: t('Home', currentLang), icon: Home },
        { to: '/opportunities', label: t('Opportunities', currentLang), icon: Briefcase },
        { to: '/marketplace', label: t('Marketplace', currentLang), icon: ShoppingBag },
        { to: '/bookings', label: t('Bookings', currentLang), icon: Calendar },
        { to: '/profile', label: t('Profile', currentLang), icon: User },
      ]

  const sidebarTools = [
    { to: '/assistant', label: t('AI Assistant', currentLang), icon: Bot },
    { to: '/chat',      label: t('Messages', currentLang),     icon: MessageSquare },
    { to: '/earnings',  label: t('Earnings', currentLang),     icon: TrendingUp },
    { to: '/skills',    label: t('My Skills', currentLang),    icon: Zap },
    { to: '/settings',  label: t('Settings', currentLang),     icon: SettingsIcon },
  ]

  const filteredTools = sidebarTools.filter(item => {
    if (isJobProvider) {
      return item.to !== '/earnings' && item.to !== '/skills'
    }
    return true
  })

  React.useEffect(() => {
    const fetchNotifs = async () => {
      const token = localStorage.getItem('sh_token')
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success && data.data) {
          setNotifications(data.data)
        }
      } catch (err) {
        // ignore
      }
    }
    fetchNotifs()
    
    // Poll notifications every 4 seconds to catch new messages in real-time
    const interval = setInterval(fetchNotifs, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await authAPI.logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:text-sm"
      >
        Skip to main content
      </a>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-border fixed top-0 left-0 z-30 shadow-card">
        {/* Logo — semantic button */}
        <button
          className="flex items-center gap-3 px-5 py-4 border-b border-border cursor-pointer hover:bg-primary-50 transition-colors text-left w-full"
          onClick={() => navigate('/home')}
          aria-label="Career 2.0 — Go to Home"
        >
          <img
            src="/logo.png"
            alt="Career 2.0 Logo"
            className="w-11 h-11 rounded-xl object-cover shadow-xs border border-primary-200"
          />
          <div>
            <p className="font-bold text-lg text-foreground leading-none">Career 2.0</p>
            <p className="text-xs text-muted mt-0.5">Earn with your Wisdom</p>
          </div>
        </button>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">{t('Main', currentLang)}</p>
          {mainNavItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}

          <div className="border-t border-border my-3" />
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">{t('Tools', currentLang)}</p>
          {filteredTools.map(item => (
            <NavItem
              key={item.to}
              {...item}
              badgeCount={item.to === '/chat' ? notifications.filter(n => n.type === 'chat' && !n.read).length : 0}
            />
          ))}
        </nav>

        {/* User Footer & Logout */}
        <div className="px-3 pb-4 border-t border-border pt-3 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium text-base transition-all min-h-touch"
            id="btn-logout-desktop"
          >
            <LogOut size={24} className="shrink-0" />
            <span>{t('Sign Out', currentLang)}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg-white z-50 shadow-float transform transition-transform duration-300 lg:hidden flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Career 2.0 Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-xs border border-primary-200"
            />
            <div>
              <p className="font-bold text-lg text-foreground leading-none">Career 2.0</p>
              <p className="text-xs text-muted mt-0.5">Earn with your Wisdom</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto pb-10" aria-label="Mobile navigation">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">{t('Main', currentLang)}</p>
          {mainNavItems.map(item => (
            <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
          <div className="border-t border-border my-3" />
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">{t('Tools', currentLang)}</p>
          {filteredTools.map(item => (
            <NavItem
              key={item.to}
              {...item}
              onClick={() => setSidebarOpen(false)}
              badgeCount={item.to === '/chat' ? notifications.filter(n => n.type === 'chat' && !n.read).length : 0}
            />
          ))}
          <div className="border-t border-border my-3" />
          <button
            onClick={() => {
              setSidebarOpen(false)
              handleLogout()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium text-base transition-all min-h-touch mt-2"
            id="btn-logout-mobile"
          >
            <LogOut size={24} className="shrink-0" />
            <span>{t('Sign Out', currentLang)}</span>
          </button>
        </nav>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Bar (mobile/tablet) */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={26} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Career 2.0 Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-bold text-lg text-foreground">Career 2.0</span>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center relative text-primary"
            aria-label="Messages"
            id="btn-nav-messages-header"
          >
            <MessageSquare size={24} />
            {notifications.some(n => n.type === 'chat' && !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white animate-pulse" aria-hidden="true" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-24 lg:pb-8 animate-fadeIn" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Nav Bar (mobile/tablet) ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-border shadow-float"
        aria-label="Bottom navigation"
      >
        <div
          className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mainNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl min-h-touch min-w-[72px] flex-1 shrink-0 transition-all duration-150
                 ${isActive ? 'text-primary' : 'text-muted hover:text-primary'}`
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
