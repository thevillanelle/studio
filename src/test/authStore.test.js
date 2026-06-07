import { vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession:         vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange:  vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth:    vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
      signUp:             vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id', identities: [{}] } }, error: null }),
      signOut:            vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      in:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

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

  it('signOut clears user and session', async () => {
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
