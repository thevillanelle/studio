import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'

const LEVELS = ['Learning', 'Familiar', 'Proficient', 'Expert']
const CATEGORIES = ['Tech', 'Design', 'Business', 'Creative', 'Personal', 'Finance', 'Health', 'Other']
const LEVEL_COLORS = { Learning: '#D97706', Familiar: '#0D9488', Proficient: '#7C3AED', Expert: '#059669' }

export default function Skills() {
  const { user } = useAuthStore()
  const [skills, setSkills]     = useState([])
  const [adding, setAdding]     = useState(false)
  const [form, setForm]         = useState({ label: '', category: 'Tech', level: 'Familiar', notes: '' })
  const [filterCat, setFilterCat] = useState('all')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { if (user) load() }, [user])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('atelier_skills').select('*').eq('user_id', user.id).order('category').order('label')
    setSkills(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.label.trim()) return
    const { data } = await supabase.from('atelier_skills').insert({ ...form, user_id: user.id }).select().single()
    if (data) setSkills(s => [...s, data].sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label)))
    setAdding(false); setForm({ label: '', category: 'Tech', level: 'Familiar', notes: '' })
  }

  const remove = async (id) => {
    await supabase.from('atelier_skills').delete().eq('id', id)
    setSkills(s => s.filter(x => x.id !== id))
  }

  const updateLevel = async (id, level) => {
    await supabase.from('atelier_skills').update({ level }).eq('id', id)
    setSkills(s => s.map(x => x.id === id ? { ...x, level } : x))
  }

  const filtered   = filterCat === 'all' ? skills : skills.filter(s => s.category === filterCat)
  const categories = [...new Set(skills.map(s => s.category))]

  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="page-bg">
      <PageHeader title="Skills 🧠" backTo="/dashboard" />
      <main className="px-6 py-8 max-w-2xl mx-auto">

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {LEVELS.map(level => {
            const count = skills.filter(s => s.level === level).length
            return (
              <div key={level} className="card text-center py-3">
                <p className="font-display text-at-ink text-2xl">{count}</p>
                <p className="text-xs font-body" style={{ color: LEVEL_COLORS[level] }}>{level}</p>
              </div>
            )
          })}
        </div>

        <button onClick={() => setAdding(true)} className="btn-primary w-full mb-6">+ Add a skill</button>

        {adding && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
            <p className="section-label mb-4">New skill</p>
            <div className="space-y-3">
              <input className="input" placeholder="Skill name *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="input" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <input className="input" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="btn-primary flex-1">Save ✦</button>
              <button onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
            <button onClick={() => setFilterCat('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-pill text-xs font-body border transition-all ${filterCat === 'all' ? 'bg-at-teal text-white border-at-teal' : 'bg-white border-at-border text-at-muted'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-pill text-xs font-body border transition-all ${filterCat === c ? 'bg-at-teal text-white border-at-teal' : 'bg-white border-at-border text-at-muted'}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-at-muted font-body py-8">Loading…</p>
        ) : skills.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-at-muted font-body">Track what you know. Start adding skills.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="section-label mb-3">{cat}</p>
                <div className="space-y-2">
                  {items.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="card flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-body text-at-ink font-medium text-sm">{s.label}</p>
                        {s.notes && <p className="text-xs text-at-muted font-body">{s.notes}</p>}
                      </div>
                      <select value={s.level} onChange={e => updateLevel(s.id, e.target.value)}
                        className="text-xs font-body border border-at-border rounded-pill px-2 py-1 focus:outline-none focus:border-at-teal"
                        style={{ color: LEVEL_COLORS[s.level] }}>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <button onClick={() => remove(s.id)} className="text-at-muted hover:text-red-400 text-sm">×</button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
