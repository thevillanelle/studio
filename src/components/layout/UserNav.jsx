import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../stores/useAuthStore'
import AuthModal from '../AuthModal'
import ThemeToggle from '../ThemeToggle'
import { goToRobinProfile } from '../../lib/robinHandoff'

function getInitials(user) {
  if (!user) return null
  const name = user.user_metadata?.full_name || user.user_metadata?.name
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : parts[0][0].toUpperCase()
  }
  return user.email?.[0]?.toUpperCase() || '?'
}

const NAV = [
  { path: '/dashboard', label: 'Dashboard',  emoji: '🏠' },
  { path: '/fire',      label: 'FIRE',       emoji: '🔥' },
  { path: '/projects',  label: 'Projects',   emoji: '📋' },
  { path: '/circle',    label: 'My Circle',  emoji: '👥' },
  { path: '/skills',    label: 'Skills',     emoji: '🧠' },
  { path: '/goals',     label: 'Goals',      emoji: '🎯' },
]

const OTHER_APPS = [
  { url: 'https://wear.ritualware.app',   label: 'Ritualwear',   emoji: '👗' },
  { url: 'https://glowup.ritualware.app', label: 'Glow Up',      emoji: '🔺' },
  { url: 'https://where.ritualware.app',  label: 'Ritualwhere?', emoji: '📍' },
  { url: 'https://wealth.ritualware.app', label: 'Ritualwealth', emoji: '💰' },
]

export default function UserNav() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen]         = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const initials = getInitials(user)
  const go = (path) => { navigate(path); setOpen(false) }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: user ? 'linear-gradient(135deg, #0D9488, #14B8A6)' : 'white', border: user ? 'none' : '2px solid #E7E5E4' }}
      >
        {user ? (
          <span className="text-white text-sm font-bold font-display">{initials}</span>
        ) : (
          <svg className="w-5 h-5 text-at-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>

              <div className="p-5 border-b border-at-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display text-lg text-at-ink">m'atelier</p>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <ThemeToggle />
                    <button onClick={() => setOpen(false)} className="text-at-muted hover:text-at-ink text-xl">×</button>
                  </div>
                </div>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #0D9488, #14B8A6)' }}>{initials}</div>
                    <div>
                      <p className="text-sm font-semibold text-at-ink truncate max-w-[160px]">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs text-at-muted truncate max-w-[160px]">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setOpen(false); setShowAuth(true) }} className="w-full bg-at-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-at-plum transition-colors">Sign in or create account →</button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs font-semibold text-at-muted uppercase tracking-wider mb-2">m'atelier</p>
                <div className="space-y-1 mb-6">
                  {NAV.map(link => (
                    <button key={link.path} onClick={() => go(link.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${location.pathname === link.path ? 'bg-at-teal3 text-at-teal' : 'text-at-plum hover:bg-at-warm'}`}>
                      <span className="text-base">{link.emoji}</span>{link.label}
                    </button>
                  ))}
                  <button onClick={() => { goToRobinProfile(); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left text-at-plum hover:bg-at-warm">
                    <span className="text-base">👤</span>My Ritual Profile
                  </button>
                </div>
                <p className="text-xs font-semibold text-at-muted uppercase tracking-wider mb-2">Ritualware suite</p>
                <div className="space-y-1">
                  {OTHER_APPS.map(app => (
                    <a key={app.url} href={app.url} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-at-plum hover:bg-at-warm transition-colors">
                      <span className="text-base">{app.emoji}</span>{app.label}<span className="ml-auto text-at-muted text-xs">↗</span>
                    </a>
                  ))}
                </div>
              </div>

              {user && (
                <div className="p-4 border-t border-at-border">
                  <button onClick={() => { signOut(); setOpen(false) }} className="w-full text-sm text-at-muted hover:text-at-ink transition-colors py-2">Sign out</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>{showAuth && <AuthModal onClose={() => setShowAuth(false)} />}</AnimatePresence>
    </>
  )
}
