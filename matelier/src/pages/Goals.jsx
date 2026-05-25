import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'

const CATEGORIES = ['Career', 'Health', 'Creative', 'Financial', 'Relationships', 'Learning', 'Personal', 'Other']
const TIMEFRAMES = ['This week', 'This month', 'This quarter', 'This year', 'Long-term']

const EMPTY = { title: '', category: 'Personal', timeframe: 'This quarter', description: '', is_complete: false }

export default function Goals() {
  const { user } = useAuthStore()
  const [goals, setGoals]   = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [filter, setFilter]   = useState('active') // active | complete
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('atelier_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.title.trim()) return
    if (editing === 'new') {
      const { data } = await supabase.from('atelier_goals').insert({ ...form, user_id: user.id }).select().single()
      if (data) setGoals(g => [data, ...g])
    } else {
      const { data } = await supabase.from('atelier_goals').update(form).eq('id', editing).select().single()
      if (data) setGoals(g => g.map(x => x.id === editing ? data : x))
    }
    setEditing(null); setForm(EMPTY)
  }

  const toggle = async (goal) => {
    const updated = { is_complete: !goal.is_complete }
    await supabase.from('atelier_goals').update(updated).eq('id', goal.id)
    setGoals(g => g.map(x => x.id === goal.id ? { ...x, ...updated } : x))
  }

  const remove = async (id) => {
    await supabase.from('atelier_goals').delete().eq('id', id)
    setGoals(g => g.filter(x => x.id !== id))
  }

  const filtered = goals.filter(g => filter === 'active' ? !g.is_complete : g.is_complete)

  const CAT_COLORS = { Career: '#0D9488', Health: '#059669', Creative: '#7C3AED', Financial: '#D97706', Relationships: '#EC4899', Learning: '#3B82F6', Personal: '#6B7280', Other: '#9CA3AF' }

  return (
    <div className="page-bg">
      <PageHeader title="Goals 🎯" backTo="/dashboard" />
      <main className="px-6 py-8 max-w-2xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-4">
            <p className="font-display text-at-ink text-3xl">{goals.filter(g => !g.is_complete).length}</p>
            <p className="text-xs text-at-muted font-body">Active</p>
          </div>
          <div className="card text-center py-4">
            <p className="font-display text-at-active text-3xl">{goals.filter(g => g.is_complete).length}</p>
            <p className="text-xs text-at-muted font-body">Complete</p>
          </div>
          <div className="card text-center py-4">
            <p className="font-display text-at-gold text-3xl">{goals.length}</p>
            <p className="text-xs text-at-muted font-body">Total</p>
          </div>
        </div>

        <button onClick={() => { setForm(EMPTY); setEditing('new') }} className="btn-primary w-full mb-6">+ New goal</button>

        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="card mb-6">
              <p className="section-label mb-4">{editing === 'new' ? 'New goal' : 'Edit goal'}</p>
              <div className="space-y-3">
                <input className="input" placeholder="What are you working toward? *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="input" value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))}>
                    {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <textarea className="input resize-none" rows={3} placeholder="Why does this matter? How will you know you've achieved it?"
                  value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={save} className="btn-primary flex-1">Save ✦</button>
                <button onClick={() => { setEditing(null); setForm(EMPTY) }} className="btn-secondary flex-1">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['active', 'complete'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-pill text-sm font-body font-semibold border transition-all capitalize ${filter === f ? 'bg-at-teal text-white border-at-teal' : 'bg-white border-at-border text-at-muted'}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-at-muted font-body py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-at-muted font-body">{filter === 'active' ? 'No active goals. What are you working toward?' : 'Nothing completed yet — but it\'s coming.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((g, i) => (
              <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`card flex gap-4 ${g.is_complete ? 'opacity-60' : ''}`}>
                {/* Checkbox */}
                <button onClick={() => toggle(g)}
                  className="w-5 h-5 rounded border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-all"
                  style={{ borderColor: g.is_complete ? '#059669' : CAT_COLORS[g.category] || '#0D9488', background: g.is_complete ? '#059669' : 'transparent' }}>
                  {g.is_complete && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-display text-at-ink text-lg leading-snug ${g.is_complete ? 'line-through' : ''}`}>{g.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs font-body px-2 py-0.5 rounded-pill" style={{ background: (CAT_COLORS[g.category] || '#0D9488') + '20', color: CAT_COLORS[g.category] || '#0D9488' }}>
                        {g.category}
                      </span>
                    </div>
                  </div>
                  {g.timeframe && <p className="text-xs text-at-muted font-body mt-0.5">{g.timeframe}</p>}
                  {g.description && <p className="text-xs text-at-plum font-body mt-2 leading-relaxed">{g.description}</p>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setForm(g); setEditing(g.id) }} className="btn-ghost text-xs">Edit</button>
                    <button onClick={() => remove(g.id)} className="text-xs text-red-400 hover:text-red-600 font-body">Delete</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
