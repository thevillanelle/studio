import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import ThemeToggle from '../components/ThemeToggle'
import { useAuthStore } from '../stores/useAuthStore'
import AuthModal from '../components/AuthModal'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }

const FEATURES = [
  { emoji: '📋', label: 'Projects',  desc: 'What you\'re building' },
  { emoji: '👥', label: 'My Circle', desc: 'The people in your life' },
  { emoji: '🧠', label: 'Skills',    desc: 'What you know' },
  { emoji: '🎯', label: 'Goals',     desc: 'Where you\'re going' },
]

export default function Welcome() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading])

  return (
    <>
    <div style={{position:'fixed',top:'16px',right:'16px',zIndex:50}}><ThemeToggle /></div>
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FAFAF8 0%, #F0FDF9 100%)' }}>

      <div className="absolute top-0 right-0 w-96 h-96 bg-at-teal/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-at-gold/10 rounded-full blur-[80px]" />

      <motion.div className="max-w-lg w-full relative z-10" variants={stagger} initial="hidden" animate="show">

        {/* Name */}
        <motion.div variants={rise} className="text-center mb-2">
          <h1 className="font-display text-at-ink leading-[0.9]"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}>
            m'atelier
          </h1>
        </motion.div>
        <motion.div variants={rise} className="text-center mb-10">
          <p className="font-body text-at-muted text-lg">Your life, managed.</p>
        </motion.div>

        {/* Feature cards — clickable, open auth */}
        <motion.div variants={rise} className="grid grid-cols-2 gap-3 mb-10">
          {FEATURES.map(f => (
            <button key={f.label} onClick={() => setShowAuth(true)}
              className="card-teal p-4 text-left hover:-translate-y-1 hover:shadow-soft transition-all duration-150 cursor-pointer w-full">
              <span className="text-2xl block mb-1">{f.emoji}</span>
              <p className="font-display text-at-ink text-base">{f.label}</p>
              <p className="text-xs text-at-muted font-body">{f.desc}</p>
            </button>
          ))}
        </motion.div>

        <motion.div variants={rise} className="flex flex-col gap-3 max-w-sm mx-auto">
          <button onClick={() => setShowAuth(true)} className="btn-primary w-full text-center">
            Enter m'atelier ✦
          </button>
        </motion.div>

        <motion.div variants={rise} className="flex justify-center gap-6 mt-10 text-at-muted text-xs font-body">
          <a href="https://wear.ritualware.app"   className="hover:text-at-teal transition-colors">Ritualwear ↗</a>
          <a href="https://glowup.ritualware.app" className="hover:text-at-teal transition-colors">Glow Up ↗</a>
          <a href="https://where.ritualware.app"  className="hover:text-at-teal transition-colors">Ritualwhere? ↗</a>
        </motion.div>
      </motion.div>

      <AnimatePresence>{showAuth && <AuthModal onClose={() => setShowAuth(false)} />}</AnimatePresence>
    </div>
    </>
  )
}
