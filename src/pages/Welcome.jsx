import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import AuthModal from '../components/AuthModal'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }

export default function Welcome() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FAFAF8 0%, #F0FDF9 100%)' }}>

      <div className="absolute top-0 right-0 w-96 h-96 bg-at-teal/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-at-gold/10 rounded-full blur-[80px]" />

      <motion.div className="max-w-lg w-full relative z-10" variants={stagger} initial="hidden" animate="show">

        {/* Suite label */}
        <motion.div variants={rise} className="flex justify-center mb-8">
          <span className="bg-white border border-at-border text-at-muted font-body text-xs px-4 py-2 rounded-pill shadow-card">
            Ritualware · Life Management
          </span>
        </motion.div>

        {/* Name */}
        <motion.div variants={rise} className="text-center mb-2">
          <h1 className="font-display text-at-ink leading-[0.9]"
            style={{ fontSize: 'clamp(4rem, 14vw, 8rem)' }}>
            m'atelier
          </h1>
        </motion.div>
        <motion.div variants={rise} className="text-center mb-8">
          <p className="font-body text-at-muted text-lg">Your life, managed. Projects, people, skills, goals.</p>
        </motion.div>

        {/* Features */}
        <motion.div variants={rise} className="grid grid-cols-2 gap-3 mb-10">
          {[
            { emoji: '📋', label: 'Projects', desc: 'What you\'re building' },
            { emoji: '👥', label: 'My Circle', desc: 'The people in your life' },
            { emoji: '🧠', label: 'Skills', desc: 'What you know' },
            { emoji: '🎯', label: 'Goals', desc: 'Where you\'re going' },
          ].map(f => (
            <div key={f.label} className="card-teal p-4">
              <span className="text-2xl block mb-1">{f.emoji}</span>
              <p className="font-display text-at-ink text-base">{f.label}</p>
              <p className="text-xs text-at-muted font-body">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={rise} className="flex flex-col gap-3 max-w-sm mx-auto">
          <button onClick={() => setShowAuth(true)} className="btn-primary w-full text-center">
            Enter m'atelier ✦
          </button>
        </motion.div>

        <motion.div variants={rise} className="flex justify-center gap-6 mt-10 text-at-muted text-xs font-body">
          <a href="https://vile-style-oracle.vercel.app" className="hover:text-at-teal transition-colors">Ritualwear ↗</a>
          <a href="https://glow-jdebrhgz1-thevillanelles-projects.vercel.app" className="hover:text-at-teal transition-colors">Glow Up ↗</a>
          <a href="https://ritualwhere.vercel.app" className="hover:text-at-teal transition-colors">Ritualwhere? ↗</a>
        </motion.div>
      </motion.div>

      <AnimatePresence>{showAuth && <AuthModal onClose={() => setShowAuth(false)} />}</AnimatePresence>
    </div>
  )
}
