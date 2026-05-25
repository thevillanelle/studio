import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthModal from './AuthModal'

export default function SavePrompt() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 mb-4 text-center"
      >
        <p className="text-sm font-semibold text-gray-700 mb-1">💾 Sign in to save these results</p>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Your results are held in this browser. Sign in and they'll be saved to your profile — no retaking required.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="bg-gray-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
        >
          Sign in or create account →
        </button>
      </motion.div>

      <AnimatePresence>
        {open && <AuthModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
