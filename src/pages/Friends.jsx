import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/useAuthStore'
import { useSocialStore } from '../stores/useSocialStore'
import { supabase } from '../lib/supabase'

function Avatar({ name, size = 36 }) {
  const initials = name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.35,
      flexShrink: 0,
    }}>{initials}</div>
  )
}

function friendName(f, userId) {
  const meta = f.requester_id === userId
    ? f.addressee_meta
    : f.requester_meta
  return meta?.full_name || meta?.name || 'Ritual member'
}

export default function Friends() {
  const { user } = useAuthStore()
  const { friends, pending, loadFriends, loadPending, acceptFriendRequest, declineFriendRequest, unfriend, sendFriendRequest } = useSocialStore()
  const [email, setEmail]   = useState('')
  const [msg, setMsg]       = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) return
    loadFriends(user.id)
    loadPending(user.id)
  }, [user])

  const handleInvite = async () => {
    if (!email.trim()) return
    setSending(true)
    setMsg(null)

    // Look up user by email
    const { data: profile } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email.trim())
      .single()

    if (!profile) {
      setMsg({ error: true, text: 'No Ritualware account found for that email.' })
      setSending(false)
      return
    }

    const { data, error } = await sendFriendRequest(profile.id)
    if (error || data?.error) {
      setMsg({ error: true, text: data?.error || 'Something went wrong.' })
    } else {
      setMsg({ error: false, text: `Request sent to ${email}.` })
      setEmail('')
    }
    setSending(false)
  }

  if (!user) return null

  return (
    <div className="page-bg min-h-screen">
      <main className="px-6 py-8 max-w-xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-label mb-1">Social</p>
          <h1 className="font-display text-3xl mb-8" style={{ color: 'var(--ink)' }}>Your circle</h1>

          {/* Invite */}
          <div className="card mb-6">
            <p className="section-label mb-3">Add a connection</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="friend@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                className="flex-1"
                style={{
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: '0.75rem', padding: '0.6rem 0.875rem',
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem',
                  color: 'var(--ink)', outline: 'none',
                }}
              />
              <button onClick={handleInvite} disabled={sending} className="btn-primary text-sm" style={{ flexShrink: 0 }}>
                {sending ? '…' : 'Send →'}
              </button>
            </div>
            {msg && (
              <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', marginTop: '0.5rem', letterSpacing: '0.08em', color: msg.error ? '#C4717A' : '#6AAD8A' }}>
                {msg.text}
              </p>
            )}
          </div>

          {/* Pending requests */}
          {pending.length > 0 && (
            <div className="card mb-6">
              <p className="section-label mb-3">Pending requests ({pending.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pending.map(p => {
                  const name = p.requester?.raw_user_meta_data?.full_name || p.requester?.email || 'Someone'
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={name} />
                      <div style={{ flex: 1 }}>
                        <p className="font-display text-sm" style={{ color: 'var(--ink)' }}>{name}</p>
                        <p className="text-xs font-body" style={{ color: 'var(--ink-muted)' }}>wants to connect</p>
                      </div>
                      <button onClick={() => acceptFriendRequest(p.requester_id)} className="btn-primary text-xs" style={{ padding: '0.4rem 0.875rem' }}>Accept</button>
                      <button onClick={() => declineFriendRequest(p.requester_id, user.id)} className="btn-ghost text-xs" style={{ padding: '0.4rem 0.875rem' }}>Decline</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Friends list */}
          <div className="card">
            <p className="section-label mb-3">Connections ({friends.length})</p>
            {friends.length === 0 ? (
              <p className="text-sm font-body" style={{ color: 'var(--ink-muted)' }}>
                No connections yet. Invite someone above to get started.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {friends.map(f => {
                  const isRequester = f.requester_id === user.id
                  const otherId     = isRequester ? f.addressee_id : f.requester_id
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={otherId} size={36} />
                      <div style={{ flex: 1 }}>
                        <p className="font-display text-sm" style={{ color: 'var(--ink)' }}>Connected</p>
                        <p className="text-xs font-body font-mono" style={{ color: 'var(--ink-muted)', fontSize: '0.6rem' }}>{otherId}</p>
                      </div>
                      <button onClick={() => unfriend(f.id)} className="btn-ghost text-xs" style={{ padding: '0.4rem 0.875rem', color: '#C4717A' }}>Remove</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
