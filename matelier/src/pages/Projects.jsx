import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'

const STATUSES = ['active', 'planning', 'wrap', 'complete', 'cancelled']
const STATUS_COLORS = { active: '#0D9488', planning: '#D97706', wrap: '#7C3AED', complete: '#059669', cancelled: '#9CA3AF' }
const STATUS_LABELS = { active: 'Active', planning: 'Planning', wrap: 'Wrapping up', complete: 'Complete', cancelled: 'Cancelled' }

const EMPTY = { name: '', status: 'active', objective: '', task_1: '', task_2: '', task_3: '', end_date: '', link: '', notes: '' }

export default function Projects() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [filter, setFilter]     = useState('all')
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('atelier_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.name.trim()) return
    if (editing === 'new') {
      const { data } = await supabase.from('atelier_projects').insert({ ...form, user_id: user.id }).select().single()
      if (data) setProjects(p => [data, ...p])
    } else {
      const { data } = await supabase.from('atelier_projects').update(form).eq('id', editing).select().single()
      if (data) setProjects(p => p.map(x => x.id === editing ? data : x))
    }
    setEditing(null); setForm(EMPTY)
  }

  const remove = async (id) => {
    await supabase.from('atelier_projects').delete().eq('id', id)
    setProjects(p => p.filter(x => x.id !== id))
  }

  const startEdit = (p) => { setForm(p); setEditing(p.id) }
  const startNew  = ()  => { setForm(EMPTY); setEditing('new') }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const counts   = STATUSES.reduce((a, s) => ({ ...a, [s]: projects.filter(p => p.status === s).length }), {})

  return (
    <div className="page-bg">
      <PageHeader title="Projects 📋" backTo="/dashboard" />
      <main className="px-6 py-8 max-w-2xl mx-auto">

        {/* Stats */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
          <button onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-xs font-body font-semibold border transition-all ${filter === 'all' ? 'bg-at-teal text-white border-at-teal' : 'bg-white border-at-border text-at-muted hover:border-at-teal'}`}>
            All ({projects.length})
          </button>
          {STATUSES.map(s => counts[s] > 0 && (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-pill text-xs font-body font-semibold border transition-all ${filter === s ? 'text-white border-transparent' : 'bg-white border-at-border text-at-muted hover:border-at-teal'}`}
              style={filter === s ? { background: STATUS_COLORS[s] } : {}}>
              {STATUS_LABELS[s]} ({counts[s]})
            </button>
          ))}
        </div>

        <button onClick={startNew} className="btn-primary w-full mb-6">+ New project</button>

        {/* Add / Edit form */}
        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="card mb-6">
              <p className="section-label mb-4">{editing === 'new' ? 'New project' : 'Edit project'}</p>
              <div className="space-y-3">
                <input className="input" placeholder="Project name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <input className="input" placeholder="Objective (what's the goal?)" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} />
                <input className="input" placeholder="Task 1" value={form.task_1} onChange={e => setForm(f => ({ ...f, task_1: e.target.value }))} />
                <input className="input" placeholder="Task 2" value={form.task_2} onChange={e => setForm(f => ({ ...f, task_2: e.target.value }))} />
                <input className="input" placeholder="Task 3" value={form.task_3} onChange={e => setForm(f => ({ ...f, task_3: e.target.value }))} />
                <input className="input" placeholder="Link (optional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
                <input type="date" className="input" value={form.end_date || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                <textarea className="input resize-none" rows={3} placeholder="Notes" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={save} className="btn-primary flex-1">Save ✦</button>
                <button onClick={() => { setEditing(null); setForm(EMPTY) }} className="btn-secondary flex-1">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project list */}
        {loading ? (
          <p className="text-center text-at-muted font-body py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-at-muted font-body">No projects here yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card">
                <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display text-at-ink text-lg">{p.name}</p>
                      <span className="badge" style={{ background: STATUS_COLORS[p.status] + '20', color: STATUS_COLORS[p.status] }}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    {p.objective && <p className="text-at-muted text-xs font-body">{p.objective}</p>}
                  </div>
                  <span className="text-at-muted text-xs font-body mt-1">{expanded === p.id ? '↑' : '↓'}</span>
                </div>

                <AnimatePresence>
                  {expanded === p.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                      {[p.task_1, p.task_2, p.task_3].filter(Boolean).length > 0 && (
                        <div className="mb-3">
                          <p className="section-label mb-2">Tasks</p>
                          {[p.task_1, p.task_2, p.task_3].filter(Boolean).map((t, i) => (
                            <div key={i} className="flex gap-2 mb-1">
                              <span className="text-at-teal text-xs mt-0.5">✦</span>
                              <p className="text-sm font-body text-at-plum">{t}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {p.notes && <p className="text-xs text-at-muted font-body mb-3 italic">"{p.notes}"</p>}
                      {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs block mb-3">View link ↗</a>}
                      {p.end_date && <p className="text-xs text-at-muted font-body mb-3">Due: {new Date(p.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => startEdit(p)} className="btn-ghost text-xs">Edit</button>
                        <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-600 font-body">Delete</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
