import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocialStore } from '../stores/useSocialStore'
import { useAuthStore } from '../stores/useAuthStore'

const TYPE_ICONS = {
  friend_request:   '👋',
  friend_accepted:  '🤝',
  group_invite:     '👥',
  badge_earned:     '🏅',
  milestone_reached:'🎯',
  cheer:            '🎉',
  default:          '✦',
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, loadNotifications, markAllRead, markRead } = useSocialStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (user) loadNotifications(user.id)
  }, [user])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: '#C4717A', color: '#fff',
            borderRadius: '999px', fontSize: '0.55rem',
            fontWeight: 700, minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: '320px', background: 'white',
              borderRadius: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #f0ede8', zIndex: 100,
              maxHeight: '420px', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: '0.9rem', color: '#1a1410', fontWeight: 600 }}>Notifications</p>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead(user.id)}
                  style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#8a9e96', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}>
                  mark all read
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <p style={{ padding: '2rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.65rem', color: '#c0b8b0', letterSpacing: '0.08em' }}>
                  nothing yet
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid #f8f6f3',
                      background: n.read ? 'transparent' : '#faf9f7',
                      cursor: 'pointer',
                      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{TYPE_ICONS[n.type] ?? TYPE_ICONS.default}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: '0.8rem', color: '#1a1410', marginBottom: '0.2rem' }}>{n.title}</p>
                      {n.body && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: '#8a9e96', lineHeight: 1.4 }}>{n.body}</p>}
                      <p style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: '#c0b8b0', marginTop: '0.25rem', letterSpacing: '0.06em' }}>{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4717A', flexShrink: 0, marginTop: '4px' }} />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
