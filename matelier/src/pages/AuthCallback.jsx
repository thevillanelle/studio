import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      navigate(error ? '/' : '/dashboard', { replace: true })
    })
  }, [])
  return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <p className="font-display text-at-ink text-2xl">Signing you in…</p>
    </div>
  )
}
