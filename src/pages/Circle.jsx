import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'

const TABS = ['Friends', 'Groups', 'Feed', 'Leaderboard', 'Requests']

const EVENT_LABELS = {
  quiz_completed:      'completed a quiz',
  fire_milestone:      'hit a FIRE milestone',
  look_saved:          'saved a look',
  style_result:        'got their style result',
  neighborhood_match:  'found their neighborhood match',
  friend_joined:       'joined Ritualware',
  group_created:       'created a group',
  challenge_completed: 'completed a challenge',
  badge_earned:        'earned a badge',
}

const EVENT_EMOJI = {
  quiz_completed:      '🧠',
  fire_milestone:      '🔥',
  look_saved:          '✨',
  style_result:        '💄',
  neighborhood_match:  '📍',
  friend_joined:       '👋',
  group_created:       '👥',
  challenge_completed: '🏆',
  badge_earned:        '🎖',
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Avatar({ name, size = 10, color }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const COLORS = ['#0D9488','#D97706','#7C3AED','#059669','#EC4899','#3B82F6','#DC2626']
  const bg = color || COLORS[initials.charCodeAt(0) % COLORS.length]
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
      style={{ background: bg }}>
      {initials}
    </div>
  )
}

// ─── Friends Tab ────────────────────────────────────────────
function FriendsTab({ user, friends, onRefresh }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('style_profiles')
      .select('user_id, display_name, city')
      .ilike('display_name', `%${query}%`)
      .neq('user_id', user.id)
      .limit(10)
    setResults(data || [])
    setSearching(false)
  }

  const sendRequest = async (targetId) => {
    await supabase.rpc('send_friend_request', { target_id: targetId })
    setResults(r => r.filter(x => x.user_id !== targetId))
  }

  const unfriend = async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    onRefresh()
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="section-label mb-3">Find people</p>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Search by display name…"
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()} />
          <button onClick={search} className="btn-secondary text-sm px-4">Search</button>
        </div>
        {searching && <p className="text-xs text-at-muted mt-2 font-body">Searching…</p>}
        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map(r => (
              <div key={r.user_id} className="flex items-center gap-3">
                <Avatar name={r.display_name} size={8} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-at-ink">{r.display_name}</p>
                  {r.city && <p className="text-xs text-at-muted font-body">{r.city}</p>}
                </div>
                <button onClick={() => sendRequest(r.user_id)} className="btn-primary text-xs px-3 py-1.5">Connect</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {friends.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-at-muted font-body text-sm">No connections yet. Search for someone above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="section-label">{friends.length} connection{friends.length !== 1 ? 's' : ''}</p>
          {friends.map(f => (
            <div key={f.id} className="card flex items-center gap-3">
              <Avatar name={f.other_name} size={10} />
              <div className="flex-1">
                <p className="font-display text-at-ink">{f.other_name || 'Ritualware user'}</p>
                {f.other_city && <p className="text-xs text-at-muted font-body">{f.other_city}</p>}
              </div>
              <button onClick={() => unfriend(f.id)} className="text-xs text-at-muted hover:text-red-400 font-body">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Groups Tab ──────────────────────────────────────────────
function GroupsTab({ user, groups, onRefresh }) {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', cover_emoji: '✦', privacy: 'private' })
  const [expanded, setExpanded] = useState(null)

  const create = async () => {
    if (!form.name.trim()) return
    const { data: grp } = await supabase.from('groups')
      .insert({ ...form, created_by: user.id })
      .select().single()
    if (grp) {
      await supabase.from('group_members').insert({ group_id: grp.id, user_id: user.id, role: 'admin', status: 'active' })
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        actor_name: user.user_metadata?.full_name || user.email,
        event_type: 'group_created',
        payload: { group_name: grp.name },
        visibility: 'friends',
      })
    }
    setCreating(false)
    setForm({ name: '', description: '', cover_emoji: '✦', privacy: 'private' })
    onRefresh()
  }

  const leaveGroup = async (groupId) => {
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setCreating(true)} className="btn-primary w-full">+ Create group</button>

      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card space-y-3">
            <p className="section-label">New group</p>
            <div className="flex gap-2">
              <input className="input w-16 text-center text-xl" placeholder="✦" value={form.cover_emoji}
                onChange={e => setForm(f => ({ ...f, cover_emoji: e.target.value }))} maxLength={2} />
              <input className="input flex-1" placeholder="Group name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <textarea className="input resize-none" rows={2} placeholder="What's this group about?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select className="input" value={form.privacy} onChange={e => setForm(f => ({ ...f, privacy: e.target.value }))}>
              <option value="private">Private — invite only</option>
              <option value="invite_only">Invite only (searchable)</option>
              <option value="public">Public</option>
            </select>
            <div className="flex gap-2">
              <button onClick={create} className="btn-primary flex-1">Create ✦</button>
              <button onClick={() => setCreating(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {groups.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-at-muted font-body text-sm">No groups yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(g => (
            <div key={g.id} className="card">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(expanded === g.id ? null : g.id)}>
                <div className="w-10 h-10 rounded-xl bg-at-warm flex items-center justify-center text-xl flex-shrink-0">
                  {g.cover_emoji || '✦'}
                </div>
                <div className="flex-1">
                  <p className="font-display text-at-ink">{g.name}</p>
                  <p className="text-xs text-at-muted font-body capitalize">{g.privacy} · {g.member_count || 1} member{g.member_count !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-at-muted text-sm">{expanded === g.id ? '▲' : '▼'}</span>
              </div>
              <AnimatePresence>
                {expanded === g.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-at-border">
                      {g.description && <p className="text-sm font-body text-at-plum italic mb-3">"{g.description}"</p>}
                      <button onClick={() => leaveGroup(g.id)} className="text-xs text-at-muted hover:text-red-400 font-body">Leave group</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Feed Tab ────────────────────────────────────────────────
function FeedTab({ feed, loading }) {
  if (loading) return <p className="text-center text-at-muted font-body py-8">Loading feed…</p>
  if (feed.length === 0) return (
    <div className="card text-center py-10">
      <p className="text-at-muted font-body text-sm">Nothing in your feed yet. Connect with people to see their activity.</p>
    </div>
  )
  return (
    <div className="space-y-3">
      {feed.map(item => (
        <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card flex gap-3 items-start">
          <div className="text-2xl flex-shrink-0 mt-0.5">{EVENT_EMOJI[item.event_type] || '✦'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body text-at-ink">
              <span className="font-semibold">{item.actor_name || 'Someone'}</span>
              {' '}{EVENT_LABELS[item.event_type] || item.event_type}
              {item.payload?.quiz_name && <span className="text-at-muted"> · {item.payload.quiz_name}</span>}
              {item.payload?.fire_type && <span className="text-at-muted"> · {item.payload.fire_type}</span>}
              {item.payload?.group_name && <span className="text-at-muted"> · {item.payload.group_name}</span>}
            </p>
            <p className="text-xs text-at-muted mt-0.5 font-body">{timeAgo(item.created_at)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Leaderboard Tab ─────────────────────────────────────────
const PERIODS = ['weekly', 'monthly', 'all_time']
const PERIOD_LABELS = { weekly: 'This week', monthly: 'This month', all_time: 'All time' }
const MEDAL = ['🥇', '🥈', '🥉']

function LeaderboardTab({ user, groups }) {
  const [period, setPeriod]     = useState('weekly')
  const [groupId, setGroupId]   = useState(null)
  const [board, setBoard]       = useState([])
  const [myPts, setMyPts]       = useState(0)
  const [myBadges, setMyBadges] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [period, groupId])
  useEffect(() => { loadMyBadges() }, [])

  const load = async () => {
    setLoading(true)
    const [lb, pts] = await Promise.all([
      supabase.rpc('get_leaderboard', { p_group_id: groupId, p_period: period }),
      supabase.rpc('get_my_points_total'),
    ])
    setBoard(lb.data || [])
    setMyPts(pts.data || 0)
    setLoading(false)
  }

  const loadMyBadges = async () => {
    const { data } = await supabase
      .from('user_badges')
      .select('earned_at, badges(name, emoji, description)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
    setMyBadges(data || [])
  }

  return (
    <div className="space-y-6">
      {/* My stats */}
      <div className="card flex items-center gap-4">
        <div className="text-center flex-1">
          <p className="section-label mb-1">Your points</p>
          <p className="font-display text-3xl text-at-ink">{myPts.toLocaleString()}</p>
        </div>
        <div className="w-px h-12 bg-at-border" />
        <div className="text-center flex-1">
          <p className="section-label mb-1">Badges</p>
          <p className="font-display text-3xl text-at-ink">{myBadges.length}</p>
        </div>
      </div>

      {/* My badges */}
      {myBadges.length > 0 && (
        <div>
          <p className="section-label mb-3">Your badges</p>
          <div className="flex flex-wrap gap-2">
            {myBadges.map((ub, i) => (
              <div key={i} className="flex items-center gap-2 bg-at-warm rounded-xl px-3 py-2" title={ub.badges?.description}>
                <span className="text-lg">{ub.badges?.emoji}</span>
                <span className="text-xs font-semibold text-at-ink">{ub.badges?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period + group filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 bg-at-warm rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${period === p ? 'bg-white text-at-ink shadow-sm' : 'text-at-muted'}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        {groups.length > 0 && (
          <select className="input text-xs py-1.5" value={groupId || ''} onChange={e => setGroupId(e.target.value || null)}>
            <option value="">Friends leaderboard</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.cover_emoji} {g.name}</option>)}
          </select>
        )}
      </div>

      {/* Board */}
      {loading ? (
        <p className="text-center text-at-muted font-body py-6 text-sm">Loading…</p>
      ) : board.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-at-muted font-body text-sm">No points yet this period. Complete challenges to earn points.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {board.map((row, i) => (
            <div key={String(row.user_id)} className={`card flex items-center gap-3 ${row.user_id === user.id ? 'ring-1 ring-at-teal' : ''}`}>
              <span className="text-xl w-8 text-center flex-shrink-0">{MEDAL[i] || `#${row.rank}`}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-at-ink">{row.user_id === user.id ? 'You' : 'Member'}</p>
                <p className="text-xs text-at-muted font-body">{row.badge_count} badge{row.badge_count !== 1 ? 's' : ''}</p>
              </div>
              <span className="font-display text-at-ink text-lg">{Number(row.total_pts).toLocaleString()}</span>
              <span className="text-xs text-at-muted font-body">pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Requests Tab ────────────────────────────────────────────
function RequestsTab({ user, requests, onRefresh }) {
  const accept = async (requesterId) => {
    await supabase.rpc('accept_friend_request', { requester: requesterId })
    onRefresh()
  }

  const decline = async (requesterId) => {
    await supabase.from('friendships')
      .delete()
      .eq('requester_id', requesterId)
      .eq('addressee_id', user.id)
    onRefresh()
  }

  if (requests.length === 0) return (
    <div className="card text-center py-10">
      <p className="text-at-muted font-body text-sm">No pending connection requests.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="section-label">{requests.length} pending</p>
      {requests.map(r => (
        <div key={r.id} className="card flex items-center gap-3">
          <Avatar name={r.requester_name} size={10} />
          <div className="flex-1">
            <p className="font-display text-at-ink">{r.requester_name || 'Ritualware user'}</p>
            <p className="text-xs text-at-muted font-body">{timeAgo(r.created_at)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => accept(r.requester_id)} className="btn-primary text-xs px-3 py-1.5">Accept</button>
            <button onClick={() => decline(r.requester_id)} className="btn-ghost text-xs px-3 py-1.5">Decline</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────
export default function Circle() {
  const { user } = useAuthStore()
  const [tab, setTab]         = useState('Friends')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [groups, setGroups]   = useState([])
  const [feed, setFeed]       = useState([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [unread, setUnread]   = useState(0)

  useEffect(() => { if (user) loadAll() }, [user])

  const loadAll = async () => {
    await Promise.all([loadFriends(), loadGroups(), loadFeed(), loadUnread()])
  }

  const loadFriends = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    if (!data) return setFriends([])

    const otherIds = data.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
    const { data: profiles } = await supabase
      .from('style_profiles')
      .select('user_id, display_name, city')
      .in('user_id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000'])

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]))
    setFriends(data.map(f => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
      const p = profileMap[otherId] || {}
      return { ...f, other_id: otherId, other_name: p.display_name, other_city: p.city }
    }))

    // pending requests addressed to me
    const { data: pending } = await supabase
      .from('friendships')
      .select('id, requester_id, created_at')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')

    if (pending?.length) {
      const reqIds = pending.map(p => p.requester_id)
      const { data: rp } = await supabase
        .from('style_profiles')
        .select('user_id, display_name')
        .in('user_id', reqIds)
      const rpMap = Object.fromEntries((rp || []).map(p => [p.user_id, p]))
      setRequests(pending.map(p => ({ ...p, requester_name: rpMap[p.requester_id]?.display_name })))
    } else {
      setRequests([])
    }
  }

  const loadGroups = async () => {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
    if (!memberships?.length) return setGroups([])
    const ids = memberships.map(m => m.group_id)
    const { data } = await supabase.from('groups').select('*').in('id', ids)
    // get member counts
    const { data: counts } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', ids)
      .eq('status', 'active')
    const countMap = {}
    ;(counts || []).forEach(c => { countMap[c.group_id] = (countMap[c.group_id] || 0) + 1 })
    setGroups((data || []).map(g => ({ ...g, member_count: countMap[g.id] || 1 })))
  }

  const loadFeed = async () => {
    setFeedLoading(true)
    const { data } = await supabase.rpc('get_friend_feed', { p_limit: 40, p_offset: 0 })
    setFeed(data || [])
    setFeedLoading(false)
  }

  const loadUnread = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setUnread(count || 0)
  }

  return (
    <div className="page-bg">
      <PageHeader title="My Circle 👥" backTo="/dashboard" />
      <main className="px-6 py-8 max-w-2xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-at-warm rounded-2xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-colors relative ${tab === t ? 'bg-white text-at-ink shadow-sm' : 'text-at-muted hover:text-at-ink'}`}>
              {t}
              {t === 'Requests' && requests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-at-teal rounded-full text-white text-[10px] flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'Friends'     && <FriendsTab     user={user} friends={friends}   onRefresh={loadAll} />}
        {tab === 'Groups'      && <GroupsTab      user={user} groups={groups}     onRefresh={loadAll} />}
        {tab === 'Feed'        && <FeedTab        feed={feed} loading={feedLoading} />}
        {tab === 'Leaderboard' && <LeaderboardTab user={user} groups={groups} />}
        {tab === 'Requests'    && <RequestsTab    user={user} requests={requests} onRefresh={loadAll} />}
      </main>
    </div>
  )
}
