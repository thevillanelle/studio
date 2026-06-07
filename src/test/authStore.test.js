import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../../stores/useAuthStore'

beforeEach(() => {
  useAuthStore.setState({ user: null, session: null, loading: true })
})

describe('studio useAuthStore', () => {

  it('initializes with correct defaults', () => {
    const { user, session, loading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(session).toBeNull()
    expect(loading).toBe(true)
  })

  it('signInWithGoogle calls OAuth with google provider', async () => {
    const { supabase } = await import('../../lib/supabase')
    await useAuthStore.getState().signInWithGoogle()
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })

  it('signInWithEmail calls signInWithPassword with correct credentials', async () => {
    const { supabase } = await import('../../lib/supabase')
    await useAuthStore.getState().signInWithEmail('user@test.com', 'secret')
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com', password: 'secret'
    })
  })

  it('signUpWithEmail calls signUp with correct credentials', async () => {
    const { supabase } = await import('../../lib/supabase')
    await useAuthStore.getState().signUpWithEmail('user@test.com', 'secret')
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'user@test.com', password: 'secret'
    })
  })

  it('signOut clears user and session from state', async () => {
    useAuthStore.setState({ user: { id: 'u1' }, session: { access_token: 'tok' } })
    await useAuthStore.getState().signOut()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('signInWithEmail throws when supabase returns an error', async () => {
    const { supabase } = await import('../../lib/supabase')
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null, error: { message: 'Invalid credentials' }
    })
    await expect(useAuthStore.getState().signInWithEmail('bad@test.com', 'wrong'))
      .rejects.toMatchObject({ message: 'Invalid credentials' })
  })
})
