import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'krystine.hall@gmail.com'
const RITUALWEALTH_URL = import.meta.env.VITE_RITUALWEALTH_URL ?? 'https://wealth.ritualware.app'

// ─── Seed data (Krystine only) ─────────────────────────────────────────────

const SEED = {
  fire_plan: {
    fire_type: 'fat_fire',
    target_number: 2000000,
    target_age: 45,
    monthly_surplus: 2100,
    source: 'manual',
  },
  career_tracks: [
    { name: 'Builder — Internal Tools / Systems Architect', salary_min: 120000, salary_max: 150000, currency: 'USD', readiness_pct: 30, notes: 'Strongest current track', sort_order: 0 },
    { name: 'Field Leader — Apple New Store Openings',      salary_min: 110000, salary_max: 207000, currency: 'USD', readiness_pct: 20, notes: 'High ceiling, known path', sort_order: 1 },
    { name: 'French Fintech — Compliance × Systems',        salary_min: 70000,  salary_max: 110000, currency: 'EUR', readiness_pct: 25, notes: 'French at B1 → fall class planned', sort_order: 2 },
  ],
  home_plan: {
    target_city: 'Chicago', neighborhood: 'Lakeview',
    property_type: '2BR/2BA full-service condo',
    target_price: 500000, down_payment_target: 100000, down_payment_current: 0,
    artist_enclave: true,
  },
  skills: [
    { name: 'French',                   current_level: 'B1', target_level: 'C1', practice_note: 'Daily practice · fall class planned',   sort_order: 0 },
    { name: 'Systems Architecture',     current_level: 'Expert', target_level: 'Expert', practice_note: '',                              sort_order: 1 },
    { name: 'Compliance Investigation', current_level: 'Expert', target_level: 'Expert', practice_note: '',                              sort_order: 2 },
  ],
  savings_buckets: [
    { name: 'Emergency Fund',        target: 20000,  current: 4000,  do_not_touch: true,  sort_order: 0 },
    { name: 'Rent Buffer',           target: 15000,  current: 0,     do_not_touch: false, sort_order: 1 },
    { name: 'Chicago Down Payment',  target: 100000, current: 0,     do_not_touch: false, sort_order: 2 },
    { name: 'France Down Payment',   target: 40000,  current: 0,     do_not_touch: false, sort_order: 3 },
  ],
  contingency_rules: [
    {
      trigger: 'Brother escalates OR home becomes untenable for 3 days',
      action:  'Activate rent buffer · move within 30 days · delay Chicago by 12 months',
      enabled: true, sort_order: 0,
    },
    {
      trigger: 'Rotation ends with no high-comp role secured',
      action:  'Apply to Field Leader + external builder roles immediately · use emergency fund for buffer',
      enabled: true, sort_order: 1,
    },
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmt(n) { return n != null ? '$' + Number(n).toLocaleString() : '—' }
function fmtCurrency(n, cur) {
  const sym = cur === 'EUR' ? '€' : '$'
  return n ? sym + Number(n).toLocaleString() : '—'
}

function ProgressBar({ current, target, color = '#C8A86B' }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  return (
    <div>
      <div style={{ height: '4px', background: 'var(--card-border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.35rem' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--ink-muted)' }}>{fmt(current)}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--ink-muted)' }}>{fmt(target)}</span>
      </div>
    </div>
  )
}

function ReadinessBar({ pct, color = '#8FA688' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, height: '3px', background: 'var(--card-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color, minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

function Card({ title, accent, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem' }}>
      {title && (
        <p style={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent ?? 'var(--accent)', marginBottom: '1.1rem' }}>
          {title}
        </p>
      )}
      {children}
    </motion.div>
  )
}

function EditableField({ label, value, onSave, type = 'text', prefix }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  const save = () => { onSave(draft); setEditing(false) }

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>{label}</span>
        <button onClick={() => editing ? save() : setEditing(true)}
          style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>
          {editing ? 'save' : 'edit'}
        </button>
      </div>
      {editing ? (
        <input type={type} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
          style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem', padding: '0.25rem 0', outline: 'none' }} />
      ) : (
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem', color: 'var(--ink)' }}>
          {prefix}{value ?? '—'}
        </p>
      )}
    </div>
  )
}

// ─── Timeline projection ────────────────────────────────────────────────────

function buildTimeline(firePlan, buckets) {
  const surplus = firePlan?.monthly_surplus ?? 0
  if (!surplus) return []

  const today = new Date()
  const months = (n) => {
    const d = new Date(today)
    d.setMonth(d.getMonth() + Math.ceil(n))
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const events = []
  let remaining = surplus
  let elapsed = 0

  // Debt: $25k balance at ~$500/month minimum → with surplus
  const debtMonths = Math.ceil(25000 / Math.min(surplus, 1500))
  events.push({ label: 'Debt $0', date: months(debtMonths), months: debtMonths })
  elapsed = debtMonths

  const efBucket = buckets.find(b => b.name === 'Emergency Fund')
  const efNeeded = efBucket ? (efBucket.target - efBucket.current) : 16000
  if (efNeeded > 0) {
    const m = Math.ceil(efNeeded / surplus)
    elapsed += m
    events.push({ label: 'Emergency fund complete', date: months(elapsed), months: elapsed })
  }

  const rentBucket = buckets.find(b => b.name === 'Rent Buffer')
  if (rentBucket && rentBucket.target > rentBucket.current) {
    const m = Math.ceil((rentBucket.target - rentBucket.current) / surplus)
    elapsed += m
    events.push({ label: 'Rent buffer complete', date: months(elapsed), months: elapsed })
  }

  const chicagoBucket = buckets.find(b => b.name === 'Chicago Down Payment')
  if (chicagoBucket && chicagoBucket.target > chicagoBucket.current) {
    const m = Math.ceil((chicagoBucket.target - chicagoBucket.current) / surplus)
    elapsed += m
    events.push({ label: 'Chicago down payment ready', date: months(elapsed), months: elapsed })
  }

  events.push({ label: 'First property purchase (est.)', date: months(elapsed + 3), months: elapsed + 3 })

  return events
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function Fire() {
  const { user } = useAuthStore()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [seeded, setSeeded]   = useState(false)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const uid = user.id
    const [planRes, tracksRes, homeRes, skillsRes, bucketsRes, rulesRes] = await Promise.all([
      supabase.from('user_fire_plans').select('*').eq('user_id', uid).single(),
      supabase.from('user_career_tracks').select('*').eq('user_id', uid).order('sort_order'),
      supabase.from('user_home_plan').select('*').eq('user_id', uid).single(),
      supabase.from('user_skills').select('*').eq('user_id', uid).order('sort_order'),
      supabase.from('user_savings_buckets').select('*').eq('user_id', uid).order('sort_order'),
      supabase.from('user_contingency_rules').select('*').eq('user_id', uid).order('sort_order'),
    ])
    setData({
      plan:    planRes.data,
      tracks:  tracksRes.data ?? [],
      home:    homeRes.data,
      skills:  skillsRes.data ?? [],
      buckets: bucketsRes.data ?? [],
      rules:   rulesRes.data ?? [],
    })
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const seedMyData = async () => {
    if (!user || user.email !== ADMIN_EMAIL) return
    const uid = user.id

    await supabase.from('user_fire_plans').upsert({ user_id: uid, ...SEED.fire_plan })
    await supabase.from('user_career_tracks').delete().eq('user_id', uid)
    await supabase.from('user_career_tracks').insert(SEED.career_tracks.map(t => ({ user_id: uid, ...t })))
    await supabase.from('user_home_plan').upsert({ user_id: uid, ...SEED.home_plan })
    await supabase.from('user_skills').delete().eq('user_id', uid)
    await supabase.from('user_skills').insert(SEED.skills.map(s => ({ user_id: uid, ...s })))
    await supabase.from('user_savings_buckets').delete().eq('user_id', uid)
    await supabase.from('user_savings_buckets').insert(SEED.savings_buckets.map(b => ({ user_id: uid, ...b })))
    await supabase.from('user_contingency_rules').delete().eq('user_id', uid)
    await supabase.from('user_contingency_rules').insert(SEED.contingency_rules.map(r => ({ user_id: uid, ...r })))

    setSeeded(true)
    load()
  }

  const updateField = async (table, id, field, value) => {
    await supabase.from(table).update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const updatePlanField = async (field, value) => {
    await supabase.from('user_fire_plans').update({ [field]: value, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    load()
  }

  const toggleRule = async (rule) => {
    await supabase.from('user_contingency_rules').update({ enabled: !rule.enabled }).eq('id', rule.id)
    load()
  }

  if (!user) return (
    <div className="page-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ fontFamily: '"Josefin Sans", sans-serif', color: 'var(--ink-muted)' }}>Sign in to view your FIRE dashboard.</p>
    </div>
  )

  if (loading) return (
    <div className="page-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--ink-muted)' }}>loading…</p>
    </div>
  )

  const plan    = data?.plan
  const tracks  = data?.tracks ?? []
  const home    = data?.home
  const skills  = data?.skills ?? []
  const buckets = data?.buckets ?? []
  const rules   = data?.rules ?? []
  const timeline = buildTimeline(plan, buckets)

  const isEmpty = !plan && tracks.length === 0 && !home && skills.length === 0 && buckets.length === 0

  return (
    <div className="page-bg">
      <main className="px-6 py-8 max-w-2xl mx-auto">

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: '0.5rem' }}>FIRE DASHBOARD</p>
          <h2 style={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)' }}>
            {plan ? `${plan.fire_type?.replace(/_/g,' ')?.replace(/\b\w/g, c=>c.toUpperCase())} · ${fmt(plan.target_number)}` : 'Your FIRE Plan'}
          </h2>
          {plan?.target_age && (
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Target age {plan.target_age} · {fmt(plan.monthly_surplus)}/month surplus
            </p>
          )}
        </div>

        {/* Admin seed button */}
        {user.email === ADMIN_EMAIL && isEmpty && !seeded && (
          <div style={{ padding: '1.25rem', background: 'rgba(200,168,107,0.08)', border: '1px dashed var(--card-border)', borderRadius: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
              Your dashboard is empty. Load your pre-configured data?
            </p>
            <button onClick={seedMyData}
              style={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'var(--accent)', color: '#fff', padding: '0.7rem 1.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}>
              Load my data ✦
            </button>
          </div>
        )}

        {isEmpty && !seeded && user.email !== ADMIN_EMAIL && (
          <div style={{ padding: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
              No plan yet. Take the Ritualwealth quizzes to generate yours.
            </p>
            <a href={RITUALWEALTH_URL}>
              <button style={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'var(--accent)', color: '#fff', padding: '0.7rem 1.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}>
                Take the quiz →
              </button>
            </a>
          </div>
        )}

        {/* FIRE Plan config */}
        {plan && (
          <Card title="FIRE Configuration" accent="var(--accent)">
            <EditableField label="FIRE Type" value={plan.fire_type?.replace(/_/g, ' ')} onSave={v => updatePlanField('fire_type', v)} />
            <EditableField label="Target Number" value={plan.target_number} onSave={v => updatePlanField('target_number', Number(v))} type="number" prefix="$" />
            <EditableField label="Target Age" value={plan.target_age} onSave={v => updatePlanField('target_age', Number(v))} type="number" />
            <EditableField label="Monthly Surplus" value={plan.monthly_surplus} onSave={v => updatePlanField('monthly_surplus', Number(v))} type="number" prefix="$" />
          </Card>
        )}

        {/* Savings Buckets */}
        {buckets.length > 0 && (
          <Card title="Savings Buckets">
            {buckets.map(b => (
              <div key={b.id} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--ink)' }}>{b.name}</span>
                    {b.do_not_touch && <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: '#C4717A', letterSpacing: '0.1em' }}>DO NOT TOUCH</span>}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--accent)' }}>
                    {b.target > 0 ? Math.round((b.current / b.target) * 100) : 0}%
                  </span>
                </div>
                <ProgressBar current={b.current} target={b.target} color={b.do_not_touch ? '#C4717A' : 'var(--accent)'} />
              </div>
            ))}
          </Card>
        )}

        {/* Career Tracks */}
        {tracks.length > 0 && (
          <Card title="Career Tracks" accent="#8FA688">
            {tracks.map(t => (
              <div key={t.id} style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--ink)', marginBottom: '0.2rem' }}>{t.name}</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--ink-muted)' }}>
                      {fmtCurrency(t.salary_min, t.currency)} – {fmtCurrency(t.salary_max, t.currency)} {t.currency !== 'USD' ? t.currency : ''}
                    </p>
                  </div>
                </div>
                <ReadinessBar pct={t.readiness_pct} color="#8FA688" />
                {t.notes && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.4rem' }}>{t.notes}</p>}
              </div>
            ))}
          </Card>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Card title="Skills">
            {skills.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--ink)' }}>{s.name}</p>
                  {s.practice_note && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.7rem', color: 'var(--ink-muted)' }}>{s.practice_note}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--accent)' }}>{s.current_level}</span>
                  {s.target_level && s.target_level !== s.current_level && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--ink-muted)' }}> → {s.target_level}</span>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Home Plan */}
        {home && (
          <Card title="Home Plan" accent="#C4717A">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>CITY</p>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--ink)' }}>{home.target_city}{home.neighborhood ? ` · ${home.neighborhood}` : ''}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>PROPERTY</p>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--ink)' }}>{home.property_type}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>TARGET PRICE</p>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--ink)' }}>{fmt(home.target_price)}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>DOWN PAYMENT</p>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--ink)' }}>{fmt(home.down_payment_target)}</p>
              </div>
            </div>
            {home.artist_enclave && (
              <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--accent)', marginTop: '0.75rem', letterSpacing: '0.1em' }}>✦ ARTIST ENCLAVE</p>
            )}
            <div style={{ marginTop: '1rem' }}>
              <ProgressBar current={home.down_payment_current ?? 0} target={home.down_payment_target} color="#C4717A" />
            </div>
          </Card>
        )}

        {/* Contingency Rules */}
        {rules.length > 0 && (
          <Card title="Contingency Rules">
            {rules.map(r => (
              <div key={r.id} style={{ marginBottom: '1rem', padding: '1rem', background: r.enabled ? 'rgba(143,166,136,0.06)' : 'rgba(0,0,0,0.02)', border: `1px solid ${r.enabled ? '#8FA68840' : 'var(--card-border)'}`, borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.08em', color: r.enabled ? '#8FA688' : 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    IF: {r.trigger}
                  </p>
                  <button onClick={() => toggleRule(r)}
                    style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: r.enabled ? '#8FA688' : 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', flexShrink: 0, marginLeft: '1rem' }}>
                    {r.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: r.enabled ? 'var(--ink)' : 'var(--ink-muted)', lineHeight: 1.5 }}>
                  → {r.action}
                </p>
              </div>
            ))}
          </Card>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <Card title="Timeline Projections" accent="var(--accent-2)">
            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--ink-muted)', marginBottom: '1rem', letterSpacing: '0.08em' }}>
              Based on {fmt(plan?.monthly_surplus)}/month surplus · sequential allocation
            </p>
            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '1px', background: 'var(--card-border)' }} />
              {timeline.map((e, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '1.1rem' }}>
                  <div style={{ position: 'absolute', left: '-1.5rem', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)' }} />
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--ink)' }}>{e.label}</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--accent)' }}>{e.date}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Link to Ritualwealth */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href={RITUALWEALTH_URL} style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', textDecoration: 'none' }}>
            Retake quizzes at Ritualwealth →
          </a>
        </div>

      </main>
    </div>
  )
}
