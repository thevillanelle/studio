import { supabase } from './supabase'

const ROBIN_URL = 'https://robin.ritualware.app'

// Hands the current Supabase session off to Robin via the URL hash, the same
// mechanism Supabase's own OAuth/magic-link redirects use. Robin's client has
// detectSessionInUrl enabled, so it picks the session up with no extra code —
// the user lands on their real, live Ritual Profile without signing in again.
export async function goToRobinProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = ROBIN_URL
    return
  }
  const expiresIn = session.expires_at
    ? Math.max(session.expires_at - Math.floor(Date.now() / 1000), 60)
    : 3600
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: String(expiresIn),
    token_type: 'bearer',
  }).toString()
  window.location.href = `${ROBIN_URL}/?handoff=1#${hash}`
}
