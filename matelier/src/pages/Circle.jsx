import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'

const ROLES = ['Mentor', 'Collaborator', 'Friend', 'Team', 'Client', 'Vendor', 'Family', 'Other']
const EMPTY = { name: '', role: '', email: '', notes: '', work_skills: [], non_work: [] }

export default function Circle() {
  const { user } = useAuthStore()
  const [people, setPeople] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('atelier_circle').select('*').eq('user_id', user.id).order('name')
    setPeople(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.name.trim()) return
    if (editing === 'new') {
      const { data } = await supabase.from('atelier_circle').insert({ ...form, user_id: user.id }).select().single()
      if (data) setPeople(p => [...p, data].sort((a, b) => a.name.localeCompare(b.name)))
    } else {
      const { data } = await supabase.from('atelier_circle').update(form).eq('id', editing).select().single()
      if (data) setPeople(p => p.map(x => x.id === editing ? data : x))
    }
    setEditing(null); setForm(EMPTY); setSkillInput('')
  }

  const remove = async (id) => {
    await supabase.from('atelier_circle').delete().eq('id', id)
    setPeople(p => p.filter(x => x.id !== id))
  }

  const addSkill = () => {
    if (!skillInput.trim()) return
    setForm(f => ({ ...f, work_skills: [...(f.work_skills || []), skillInput.trim()] }))
    setSkillInput('')
  }

  const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const COLORS = ['#0D9488', '#D97706', '#7C3AED', '#059669', '#EC4899', '#3B82F6']

  return (
    <div className="page-bg">
      <PageHeader title="My Circle 👥" backTo="/dashboard" />
      <main className="px-6 py-8 max-w-2xl mx-auto">

        <button onClick={() => { setForm(EMPTY); setEditing('new') }} className="btn-primary w-full mb-6">+ Add someone</button>

        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="card mb-6">
              <p className="section-label mb-4">{editing === 'new' ? 'Add to your circle' : 'Edit'}</p>
              <div className="space-y-3">
                <input className="input" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="">Role / relationship</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input className="input" placeholder="Email (optional)" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <textarea className="input resize-none" rows={2} placeholder="Notes about this person" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                <div>
                  <p className="section-label mb-2">Skills / what they bring</p>
                  <div className="flex gap-2 mb-2">
                    <input className="input flex-1" placeholder="Add a skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                    <button onClick={addSkill} className="btn-secondary text-xs px-4">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.work_skills || []).map((s, i) => (
                      <span key={i} className="bg-at-teal3 text-at-teal text-xs font-body px-2.5 py-1 rounded-pill flex items-center gap-1">
                        {s}
                        <button onClick={() => setForm(f => ({ ...f, work_skills: f.work_skills.filter((_, j) => j !== i) }))} className="opacity-60 hover:opacity-100">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={save} className="btn-primary flex-1">Save ✦</button>
                <button onClick={() => { setEditing(null); setForm(EMPTY) }} className="btn-secondary flex-1">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <p className="text-center text-at-muted font-body py-8">Loading…</p>
        ) : people.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-at-muted font-body">Your circle is empty. Add the people who matter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {people.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="card">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}>
                    {getInitials(p.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-at-ink text-lg">{p.name}</p>
                    {p.role && <p className="text-xs text-at-muted font-body">{p.role}</p>}
                  </div>
                  {p.work_skills?.length > 0 && (
                    <span className="text-xs text-at-muted font-body">{p.work_skills.length} skills</span>
                  )}
                </div>

                <AnimatePresence>
                  {expanded === p.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                      {p.notes && <p className="text-sm font-body text-at-plum italic mb-3">"{p.notes}"</p>}
                      {p.email && <p className="text-xs text-at-muted font-body mb-3">📧 {p.email}</p>}
                      {p.work_skills?.length > 0 && (
                        <div className="mb-3">
                          <p className="section-label mb-2">What they bring</p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.work_skills.map(s => <span key={s} className="bg-at-teal3 text-at-teal text-xs font-body px-2.5 py-1 rounded-pill">{s}</span>)}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setForm(p); setEditing(p.id) }} className="btn-ghost text-xs">Edit</button>
                        <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-600 font-body">Remove</button>
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
