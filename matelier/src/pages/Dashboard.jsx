import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { AnimatePresence } from 'framer-motion'
import AuthModal from '../components/AuthModal'

const STATUS_BADGE = {
  active:    { label: 'Active',    cls: 'badge-active' },
  planning:  { label: 'Planning',  cls: 'badge-planning' },
  wrap:      { label: 'Wrapping',  cls: 'badge-wrap' },
  complete:  { label: 'Complete',  cls: 'badge-complete' },
  cancelled: { label: 'Cancelled', cls: 'badge-cancelled' },
}

export default function Dashboard() {
  const { user, signInWithGoogle, signOut } = useAuthStore()
  const [projects, setProjects]   = useState([])
  const [goals, setGoals]         = useState([])
  const [showAuth, setShowAuth]   = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (user) loadData()
    else setLoading(false)
  }, [user])

  const loadData = async () => {
    setLoading(true)
    const [projRes, goalRes] = await Promise.all([
      supabase.from('atelier_projects').select('*').eq('user_id', user.id)
        .in('status', ['active', 'planning']).order('created_at', { ascending: false }).limit(5),
      supabase.from('atelier_goals').select('*').eq('user_id', user.id)
        .eq('is_complete', false).order('created_at', { ascending: false }).limit(4),
    ])
    setProjects(projRes.data || [])
    setGoals(goalRes.data || [])
    setLoading(false)
  }

  return (
    <div className="page-bg">
      {/* Header */}
      <header className="px-6 py-6 border-b border-at-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-at-ink text-3xl">m'atelier</h1>
            <p className="text-at-muted text-sm font-body">Your life, managed.</p>
          </div>
          {user ? (
            <button onClick={signOut} className="btn-ghost text-xs">Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="btn-primary text-sm px-5 py-2">Sign in →</button>
          )}
        </div>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">

        {!user && (
          <div className="card mb-8 text-center py-10">
            <p className="text-5xl mb-4">✦</p>
            <h2 className="font-display text-at-ink text-2xl mb-2">Sign in to get started</h2>
            <p className="text-at-muted font-body text-sm mb-6">Your projects, circle, skills and goals — all in one place. Same login as the rest of the suite.</p>
            <button onClick={() => setShowAuth(true)} className="btn-primary inline-block">Enter m'atelier</button>
          </div>
        )}

        {user && !loading && (
          <>
            {/* Active projects */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="section-label">Active projects</p>
                <Link to="/projects" className="btn-ghost text-xs">All →</Link>
              </div>
              {projects.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-at-muted font-body text-sm mb-3">No active projects yet.</p>
                  <Link to="/projects" className="btn-primary text-sm inline-block">Add a project</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="card flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-display text-at-ink text-lg">{p.name}</p>
                        {p.objective && <p className="text-at-muted text-xs font-body mt-0.5 line-clamp-1">{p.objective}</p>}
                      </div>
                      <span className={`badge ${STATUS_BADGE[p.status]?.cls || 'badge-active'} flex-shrink-0`}>
                        {STATUS_BADGE[p.status]?.label || p.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Goals */}
            {goals.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="section-label">Current goals</p>
                  <Link to="/goals" className="btn-ghost text-xs">All →</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map((g, i) => (
                    <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="card-gold p-4">
                      <p className="text-xs text-at-gold font-body uppercase tracking-wider mb-1">{g.category || 'Goal'}</p>
                      <p className="font-display text-at-ink text-base leading-snug">{g.title}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Nav grid */}
            <p className="section-label mb-4">Your studio</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { to: '/projects', emoji: '📋', label: 'Projects', desc: 'What you\'re building' },
                { to: '/circle',   emoji: '👥', label: 'My Circle', desc: 'The people in your life' },
                { to: '/skills',   emoji: '🧠', label: 'Skills',   desc: 'What you know' },
                { to: '/goals',    emoji: '🎯', label: 'Goals',    desc: 'Where you\'re going' },
              ].map(item => (
                <Link key={item.to} to={item.to}
                  className="card hover:-translate-y-1 hover:shadow-soft transition-all duration-150">
                  <span className="text-2xl block mb-2">{item.emoji}</span>
                  <p className="font-display text-at-ink text-xl mb-0.5">{item.label}</p>
                  <p className="text-xs text-at-muted font-body">{item.desc}</p>
                </Link>
              ))}
            </div>

            {/* Suite links */}
            <div className="card text-center py-6">
              <p className="section-label mb-3">The full suite</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {[
                  { url: 'https://vile-style-oracle.vercel.app',                      label: 'Ritualwear 👗' },
                  { url: 'https://glow-jdebrhgz1-thevillanelles-projects.vercel.app', label: 'Glow Up 🔺' },
                  { url: 'https://ritualwhere.vercel.app',                            label: 'Ritualwhere? 📍' },
                ].map(app => (
                  <a key={app.url} href={app.url}
                    className="bg-at-warm border border-at-border text-at-plum text-xs font-body px-4 py-2 rounded-pill hover:border-at-teal transition-colors">
                    {app.label}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>{showAuth && <AuthModal onClose={() => setShowAuth(false)} />}</AnimatePresence>
    </div>
  )
}
