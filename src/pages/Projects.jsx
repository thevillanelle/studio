import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'

const STATUSES = ['active', 'planning', 'wrap', 'complete', 'cancelled']
const STATUS_COLORS = { active: '#0D9488', planning: '#D97706', wrap: '#7C3AED', complete: '#059669', cancelled: '#9CA3AF' }
const STATUS_LABELS = { active: 'Active', planning: 'Planning', wrap: 'Wrapping up', complete: 'Complete', cancelled: 'Cancelled' }

const EMPTY = { name: '', status: 'active', objective: '', task_1: '', task_2: '', task_3: '', end_date: '', link: '', notes: '' }

const TEMPLATES = [
  {
    emoji: '🏠',
    name: 'Home Maintenance',
    tagline: 'Your space, tended.',
    template: {
      name: 'Home Maintenance',
      status: 'active',
      objective: 'Keep my home running smoothly — nothing falls through the cracks.',
      task_1: 'Audit what needs fixing or replacing',
      task_2: 'Schedule seasonal maintenance (HVAC, deep clean, etc.)',
      task_3: 'Build a go-to vendor list',
      notes: 'Ongoing ritual. Revisit monthly.',
    },
  },
  {
    emoji: '💼',
    name: 'Work Project',
    tagline: 'Focused. Intentional. Done.',
    template: {
      name: 'Work Project',
      status: 'planning',
      objective: 'Deliver a specific work outcome with clarity and momentum.',
      task_1: 'Define the goal and success criteria',
      task_2: 'Identify stakeholders and dependencies',
      task_3: 'Set a realistic deadline and first milestone',
      notes: '',
    },
  },
  {
    emoji: '🔺',
    name: 'Body Project',
    tagline: 'Your body is a ritual.',
    template: {
      name: 'Body Project',
      status: 'active',
      objective: 'Build a relationship with my body that is consistent, intentional, and mine.',
      task_1: 'Define the goal — strength, endurance, flexibility, or all three',
      task_2: 'Set a weekly movement schedule',
      task_3: 'Track progress monthly — not daily',
      notes: 'This is a lifestyle, not a phase.',
    },
  },
  {
    emoji: '🗓️',
    name: 'Maintenance Schedule',
    tagline: 'Life, managed like a pro.',
    template: {
      name: 'Maintenance Schedule',
      status: 'active',
      objective: 'Stay on top of the recurring things that keep life running: appointments, renewals, admin.',
      task_1: 'List all recurring tasks (annual, quarterly, monthly)',
      task_2: 'Set calendar reminders for each',
      task_3: 'Review and adjust every quarter',
      notes: 'Think: dentist, car, subscriptions, passport, insurance.',
    },
  },
  {
    emoji: '📅',
    name: 'Editorial Calendar',
    tagline: 'Your life, curated.',
    template: {
      name: 'Editorial Calendar',
      status: 'planning',
      objective: 'Plan content and life moments with editorial intention — nothing reactive.',
      task_1: 'Map out the next 90 days of themes or moments',
      task_2: 'Assign content formats per week (post, story, essay, etc.)',
      task_3: 'Batch-create and schedule at least 2 weeks ahead',
      notes: 'Treat your life like a magazine. Every issue is intentional.',
    },
  },
  {
    emoji: '✨',
    name: 'Personal Glow Up',
    tagline: 'A season of becoming.',
    template: {
      name: 'Personal Glow Up',
      status: 'active',
      objective: 'Show up as the most refined, intentional version of myself this season.',
      task_1: 'Define what "glowed up" looks, feels, and sounds like',
      task_2: 'Identify three areas: physical, mental, social',
      task_3: 'Choose one non-negotiable habit per area',
      notes: 'This is a vibe, not a checklist.',
    },
  },
  {
    emoji: '💰',
    name: 'Money Move',
    tagline: 'Know where every dollar goes.',
    template: {
      name: 'Money Move',
      status: 'planning',
      objective: 'Make a deliberate, strategic move with my money — saving, investing, or eliminating.',
      task_1: 'Audit current income, expenses, and leaks',
      task_2: 'Set a specific financial goal with a number and a date',
      task_3: 'Automate at least one savings or investment action',
      notes: 'Money is a tool. Use it with intention.',
    },
  },
  {
    emoji: '🌆',
    name: 'City Life',
    tagline: 'The city is yours. Claim it.',
    template: {
      name: 'City Life',
      status: 'active',
      objective: 'Engage with the city intentionally — culturally, socially, and physically.',
      task_1: 'Make a list of 10 things to do, eat, or see this season',
      task_2: 'Plan one solo outing and one social outing per month',
      task_3: 'Explore one new neighborhood',
      notes: 'You live here. Act like it.',
    },
  },
]

export default function Projects() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [filter, setFilter]     = useState('all')
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

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
  const startNew  = ()  => { setForm(EMPTY); setEditing('new'); setShowTemplates(false) }
  const useTemplate = (t) => { setForm({ ...EMPTY, ...t.template }); setEditing('new'); setShowTemplates(false) }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const counts   = STATUSES.reduce((a, s) => ({ ...a, [s]: projects.filter(p => p.status === s).length }), {})

  return (
    <div className="page-bg">
      <PageHeader title="Projects 📋" backTo="/dashboard" />
      <main className="px-6 py-8 max-w-2xl mx-auto">

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={startNew} className="btn-primary flex-1">+ New project</button>
          <button
            onClick={() => { setShowTemplates(t => !t); setEditing(null) }}
            className={`btn-secondary flex-1 ${showTemplates ? 'border-at-teal text-at-teal' : ''}`}
          >
            {showTemplates ? 'Hide templates' : 'Start from template ✦'}
          </button>
        </div>

        {/* Template grid */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-8"
            >
              <p className="section-label mb-4">Choose a template</p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => useTemplate(t)}
                    className="card text-left hover:-translate-y-1 hover:shadow-soft transition-all duration-150 group"
                  >
                    <span className="text-2xl block mb-2">{t.emoji}</span>
                    <p className="font-display text-at-ink text-lg leading-tight mb-0.5">{t.name}</p>
                    <p className="text-xs text-at-muted font-body group-hover:text-at-teal transition-colors">{t.tagline}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status filters */}
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
