import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import {
  Home,
  Briefcase,
  ShoppingBag,
  Calendar,
  User,
  Bot,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Zap,
  Menu,
  X,
  Bell,
  LogOut,
} from 'lucide-react'
import authAPI from '../../api/auth'

const navItems = [
  { to: '/home',          label: 'Home',          icon: Home },
  { to: '/opportunities', label: 'Opportunities',  icon: Briefcase },
  { to: '/marketplace',   label: 'Marketplace',    icon: ShoppingBag },
  { to: '/bookings',      label: 'Bookings',       icon: Calendar },
  { to: '/profile',       label: 'Profile',        icon: User },
]

const sidebarExtra = [
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/chat',      label: 'Messages',     icon: MessageSquare },
  { to: '/earnings',  label: 'Earnings',     icon: TrendingUp },
  { to: '/skills',    label: 'My Skills',    icon: Zap },
  { to: '/help',      label: 'Help & Safety',icon: HelpCircle },
]

function NavItem({ to, label, icon: Icon, onClick, collapsed }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 min-h-touch font-medium text-base
         ${isActive
           ? 'bg-primary-100 text-primary font-semibold'
           : 'text-foreground hover:bg-primary-50 hover:text-primary'
         }
         ${collapsed ? 'justify-center px-2' : ''}
        `
      }
      aria-label={label}
    >
      <Icon size={24} strokeWidth={2} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

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
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-border fixed top-0 left-0 z-30 shadow-card">
        {/* Logo — semantic button */}
        <button
          className="flex items-center gap-3 px-5 py-5 border-b border-border cursor-pointer hover:bg-primary-50 transition-colors text-left w-full"
          onClick={() => navigate('/home')}
          aria-label="SilverHands — Go to Home"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl select-none">
            🤲
          </div>
          <div>
            <p className="font-bold text-lg text-foreground leading-none">SilverHands</p>
            <p className="text-xs text-muted">Earn with your Wisdom</p>
          </div>
        </button>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">Main</p>
          {navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}

          <div className="border-t border-border my-3" />
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">Tools</p>
          {sidebarExtra.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* User Footer & Logout */}
        <div className="px-3 pb-4 border-t border-border pt-3 space-y-1">
          <NavItem to="/settings" label="Settings" icon={User} />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium text-base transition-all min-h-touch"
            id="btn-logout-desktop"
          >
            <LogOut size={24} className="shrink-0" />
            <span>Sign Out</span>
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
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-float transform transition-transform duration-300 lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              🤲
            </div>
            <div>
              <p className="font-bold text-lg text-foreground leading-none">SilverHands</p>
              <p className="text-xs text-muted">Earn with your Wisdom</p>
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

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-full pb-28" aria-label="Mobile navigation">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">Main</p>
          {navItems.map(item => (
            <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
          <div className="border-t border-border my-3" />
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">Tools</p>
          {sidebarExtra.map(item => (
            <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
          <div className="border-t border-border my-3" />
          <NavItem to="/settings" label="Settings" icon={User} onClick={() => setSidebarOpen(false)} />
          <button
            onClick={() => {
              setSidebarOpen(false)
              handleLogout()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium text-base transition-all min-h-touch mt-2"
            id="btn-logout-mobile"
          >
            <LogOut size={24} className="shrink-0" />
            <span>Sign Out</span>
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
            <span className="text-2xl">🤲</span>
            <span className="font-bold text-lg text-foreground">SilverHands</span>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="p-2 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center relative"
            aria-label="Notifications"
          >
            <Bell size={24} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white" aria-hidden="true" />
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
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl min-h-touch min-w-touch flex-1 transition-all duration-150
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
