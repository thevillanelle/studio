import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/layout/PageHeader'

const AREAS = [
  { value: 'creative',  label: 'Creative work',    emoji: '✦' },
  { value: 'career',    label: 'Career',            emoji: '💼' },
  { value: 'body',      label: 'Body & wellness',   emoji: '🔺' },
  { value: 'home',      label: 'Home & space',      emoji: '🏠' },
  { value: 'community', label: 'Community',         emoji: '👥' },
  { value: 'money',     label: 'Money',             emoji: '💰' },
  { value: 'content',   label: 'Content & life',    emoji: '📅' },
  { value: 'other',     label: 'Something else',    emoji: '◈' },
]

const VIBES = [
  { value: 'fresh',   label: 'Starting fresh',         sub: 'A new chapter, a blank page.' },
  { value: 'picking', label: 'Picking something up',   sub: 'It\'s been waiting. Now is the time.' },
  { value: 'ongoing', label: 'It\'s ongoing — always', sub: 'A ritual, not a project. But worth tracking.' },
]

const SOLO_OPTIONS = [
  { value: 'solo',  label: 'Solo — this one\'s mine', sub: 'No one else needed.' },
  { value: 'people', label: 'I need people around me', sub: 'Collaborators, support, or a team.' },
]

const ROLE_OPTIONS = ['Collaborator', 'Mentor', 'Client', 'Vendor', 'Friend', 'Coach', 'Contractor', 'Partner']

const SKILL_OPTIONS = [
  'Design', 'Writing', 'Strategy', 'Photography', 'Video', 'Styling',
  'Coding', 'Finance', 'Legal', 'Marketing', 'PR', 'Logistics',
  'Personal Training', 'Nutrition', 'Accountability', 'Emotional support',
  'Admin', 'Research', 'Social media', 'Branding',
]

const TIMELINE_OPTIONS = [
  { value: 'week',    label: 'This week',      days: 7 },
  { value: 'month',   label: 'This month',     days: 30 },
  { value: 'quarter', label: 'This quarter',   days: 90 },
  { value: 'year',    label: 'This year',      days: 365 },
  { value: 'ongoing', label: 'Ongoing / no end date', days: null },
]

function getEndDate(days) {
  if (!days) return ''
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const STEP_COUNT = 8

const Pill = ({ label, selected, onClick, emoji }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-pill border font-body text-sm transition-all duration-200 ${
      selected
        ? 'bg-at-teal text-white border-at-teal shadow-soft'
        : 'bg-white border-at-border text-at-plum hover:border-at-teal hover:shadow-soft'
    }`}
  >
    {emoji && <span>{emoji}</span>}
    {label}
  </button>
)

const Card = ({ label, sub, selected, onClick, emoji }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-5 py-4 rounded-2xl border font-body transition-all duration-200 ${
      selected
        ? 'bg-at-teal text-white border-at-teal shadow-soft'
        : 'bg-white border-at-border text-at-plum hover:border-at-teal hover:shadow-soft'
    }`}
  >
    <div className="flex items-center gap-3">
      {emoji && <span className="text-2xl">{emoji}</span>}
      <div>
        <p className="font-display text-lg leading-tight">{label}</p>
        {sub && <p className={`text-xs mt-0.5 ${selected ? 'text-white/70' : 'text-at-muted'}`}>{sub}</p>}
      </div>
    </div>
  </button>
)

export default function Discover() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [area, setArea]           = useState('')
  const [vibe, setVibe]           = useState('')
  const [objective, setObjective] = useState('')
  const [tasks, setTasks]         = useState(['', '', ''])
  const [timeline, setTimeline]   = useState('')
  const [solo, setSolo]           = useState('')
  const [roles, setRoles]         = useState([])
  const [skills, setSkills]       = useState([])

  const toggleArr = (arr, set, val) =>
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])

  const canNext = [
    !!area,
    !!vibe,
    objective.trim().length > 0,
    tasks.some(t => t.trim()),
    !!timeline,
    !!solo,
    solo === 'solo' || roles.length > 0,
    solo === 'solo' || skills.length > 0,
  ]

  const areaLabel = AREAS.find(a => a.value === area)?.label || ''
  const timelineDays = TIMELINE_OPTIONS.find(t => t.value === timeline)?.days ?? null
  const endDate = getEndDate(timelineDays)

  const projectPreview = {
    name: areaLabel ? `${areaLabel} project` : 'My project',
    status: vibe === 'ongoing' ? 'active' : vibe === 'picking' ? 'active' : 'planning',
    objective,
    task_1: tasks[0],
    task_2: tasks[1],
    task_3: tasks[2],
    end_date: endDate,
    notes: '',
    link: '',
  }

  const circleStubs = roles.map(role => ({
    name: `${role} TBD`,
    role,
    work_skills: skills,
    notes: `Discovered via Discover quiz — ${areaLabel} project`,
    email: '',
    non_work: [],
  }))

  const saveAll = async () => {
    if (!user) return
    setSaving(true)
    const [projRes] = await Promise.all([
      supabase.from('atelier_projects').insert({ ...projectPreview, user_id: user.id }).select().single(),
    ])
    if (circleStubs.length > 0) {
      await supabase.from('atelier_circle').insert(circleStubs.map(s => ({ ...s, user_id: user.id })))
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => navigate('/projects'), 1800)
  }

  const stepVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit:    { opacity: 0, y: -16, transition: { duration: 0.2 } },
  }

  const steps = [
    // 0 — area
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">What area of your life is calling?</p>
      <p className="text-at-muted font-body text-sm">Every great project begins with intention.</p>
      <div className="flex flex-wrap gap-2 pt-2">
        {AREAS.map(a => (
          <Pill key={a.value} label={a.label} emoji={a.emoji} selected={area === a.value} onClick={() => setArea(a.value)} />
        ))}
      </div>
    </div>,

    // 1 — vibe
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">What's the energy?</p>
      <p className="text-at-muted font-body text-sm">Is this new, returning, or perpetual?</p>
      <div className="space-y-3 pt-2">
        {VIBES.map(v => (
          <Card key={v.value} label={v.label} sub={v.sub} selected={vibe === v.value} onClick={() => setVibe(v.value)} />
        ))}
      </div>
    </div>,

    // 2 — objective
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">Say it plainly.</p>
      <p className="text-at-muted font-body text-sm">One sentence. What is this project?</p>
      <textarea
        className="input resize-none w-full mt-2"
        rows={3}
        placeholder="e.g. Build a 12-week strength program I actually stick to…"
        value={objective}
        onChange={e => setObjective(e.target.value)}
        autoFocus
      />
    </div>,

    // 3 — tasks
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">What are the first moves?</p>
      <p className="text-at-muted font-body text-sm">Up to three. Don't overthink it.</p>
      <div className="space-y-3 pt-2">
        {tasks.map((t, i) => (
          <input
            key={i}
            className="input w-full"
            placeholder={['First move…', 'Then…', 'And…'][i]}
            value={t}
            onChange={e => setTasks(tasks.map((v, j) => j === i ? e.target.value : v))}
          />
        ))}
      </div>
    </div>,

    // 4 — timeline
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">How long do you have?</p>
      <p className="text-at-muted font-body text-sm">Set a horizon, even a loose one.</p>
      <div className="space-y-3 pt-2">
        {TIMELINE_OPTIONS.map(t => (
          <Card key={t.value} label={t.label} selected={timeline === t.value} onClick={() => setTimeline(t.value)} />
        ))}
      </div>
    </div>,

    // 5 — solo or people
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">Is this a solo act?</p>
      <p className="text-at-muted font-body text-sm">Knowing who you need is half the work.</p>
      <div className="space-y-3 pt-2">
        {SOLO_OPTIONS.map(s => (
          <Card key={s.value} label={s.label} sub={s.sub} selected={solo === s.value} onClick={() => setSolo(s.value)} />
        ))}
      </div>
    </div>,

    // 6 — roles (only if people)
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">What kinds of people?</p>
      <p className="text-at-muted font-body text-sm">Select every role you'd want in your corner.</p>
      <div className="flex flex-wrap gap-2 pt-2">
        {ROLE_OPTIONS.map(r => (
          <Pill key={r} label={r} selected={roles.includes(r)} onClick={() => toggleArr(roles, setRoles, r)} />
        ))}
      </div>
    </div>,

    // 7 — skills
    <div className="space-y-4">
      <p className="font-display text-at-ink text-3xl leading-snug">What skills do you need?</p>
      <p className="text-at-muted font-body text-sm">These will be attached to your new circle entries.</p>
      <div className="flex flex-wrap gap-2 pt-2">
        {SKILL_OPTIONS.map(s => (
          <Pill key={s} label={s} selected={skills.includes(s)} onClick={() => toggleArr(skills, setSkills, s)} />
        ))}
      </div>
    </div>,
  ]

  // Skip role/skill steps if solo
  const visibleSteps = solo === 'solo'
    ? steps.slice(0, 6)
    : steps
  const totalSteps = visibleSteps.length

  if (saved) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center px-8">
          <p className="text-5xl mb-4">✦</p>
          <p className="font-display text-at-ink text-3xl mb-2">It's in the studio.</p>
          <p className="text-at-muted font-body text-sm">Taking you to your projects…</p>
        </motion.div>
      </div>
    )
  }

  if (step >= totalSteps) {
    // Preview / confirmation screen
    return (
      <div className="page-bg">
        <PageHeader title="Discover ✦" backTo="/dashboard" />
        <main className="px-6 py-8 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-display text-at-ink text-3xl mb-1">Here's what we found.</p>
            <p className="text-at-muted font-body text-sm mb-8">Review and save — or go back to adjust.</p>

            {/* Project preview */}
            <div className="card mb-4">
              <p className="section-label mb-3">Your new project</p>
              <p className="font-display text-at-ink text-2xl mb-1">{objective || projectPreview.name}</p>
              <p className="text-at-muted text-xs font-body mb-3">{areaLabel} · {TIMELINE_OPTIONS.find(t => t.value === timeline)?.label}</p>
              {tasks.filter(Boolean).length > 0 && (
                <div className="space-y-1 mb-3">
                  {tasks.filter(Boolean).map((t, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-at-teal text-xs mt-0.5">✦</span>
                      <p className="text-sm font-body text-at-plum">{t}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Circle stubs */}
            {circleStubs.length > 0 && (
              <div className="card mb-6">
                <p className="section-label mb-3">People to find ({circleStubs.length})</p>
                <div className="space-y-2">
                  {circleStubs.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-at-teal3 flex items-center justify-center text-at-teal text-xs font-bold">?</div>
                      <div>
                        <p className="font-body text-at-ink text-sm">{c.role}</p>
                        <p className="text-xs text-at-muted font-body">{skills.slice(0, 3).join(', ')}{skills.length > 3 ? ` +${skills.length - 3}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(totalSteps - 1)} className="btn-secondary flex-1">← Adjust</button>
              <button onClick={saveAll} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save everything ✦'}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-bg min-h-screen">
      <PageHeader title="Discover ✦" backTo="/dashboard" />
      <main className="px-6 py-8 max-w-2xl mx-auto">

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-at-teal' : 'bg-at-border'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {visibleSteps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary px-6">←</button>
          )}
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext[step]}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === totalSteps - 1 ? 'Review ✦' : 'Continue →'}
          </button>
        </div>

        {/* Step counter */}
        <p className="text-center text-at-muted font-body text-xs mt-6">{step + 1} of {totalSteps}</p>
      </main>
    </div>
  )
}
