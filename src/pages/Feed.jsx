import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/useAuthStore'
import { useSocialStore } from '../stores/useSocialStore'

const EVENT_META = {
  quiz_completed:       { emoji: '🧠', label: 'completed a quiz' },
  fire_milestone:       { emoji: '🔥', label: 'hit a FIRE milestone' },
  look_saved:           { emoji: '👗', label: 'saved a new look' },
  style_result:         { emoji: '✦',  label: 'completed their Style Bible' },
  neighborhood_match:   { emoji: '📍', label: 'found their neighborhood match' },
  friend_joined:        { emoji: '👋', label: 'joined Ritualware' },
  group_created:        { emoji: '👥', label: 'started a new group' },
  challenge_completed:  { emoji: '🏆', label: 'completed a challenge' },
  badge_earned:         { emoji: '🏅', label: 'earned a badge' },
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function FeedItem({ item }) {
  const meta = EVENT_META[item.event_type] ?? { emoji: '✦', label: item.event_type }
  const name = item.actor_name || 'A ritual member'
  const badgeName = item.payload?.badge_name
  const quizName  = item.payload?.quiz_name

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', gap: '0.875rem', padding: '1rem 0',
        borderBottom: '1px solid var(--card-border)',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', flexShrink: 0,
      }}>
        {meta.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.4 }}>
          <strong>{name}</strong>{' '}
          {meta.label}
          {badgeName && <span style={{ color: '#C8A86B' }}> — {badgeName}</span>}
          {quizName  && <span style={{ color: '#6AAD8A' }}> — {quizName}</span>}
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: 'var(--ink-muted)', marginTop: '0.25rem', letterSpacing: '0.06em' }}>
          {timeAgo(item.created_at)}
        </p>
      </div>
    </motion.div>
  )
}

export default function Feed() {
  const { user } = useAuthStore()
  const { feed, loadFeed } = useSocialStore()

  useEffect(() => {
    if (user) loadFeed()
  }, [user])

  if (!user) return null

  return (
    <div className="page-bg min-h-screen">
      <main className="px-6 py-8 max-w-xl mx-auto">

        <p className="section-label mb-1">Social</p>
        <h1 className="font-display text-3xl mb-8" style={{ color: 'var(--ink)' }}>Activity feed</h1>

        {feed.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-4xl mb-3">✦</p>
            <p className="font-display text-lg mb-1" style={{ color: 'var(--ink)' }}>Nothing yet</p>
            <p className="text-sm font-body" style={{ color: 'var(--ink-muted)' }}>
              Connect with friends to see their activity here.
            </p>
          </div>
        ) : (
          <div className="card">
            {feed.map(item => <FeedItem key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </div>
  )
}
