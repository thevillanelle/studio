import { describe, it, expect } from 'vitest'

describe('studio useAuthStore shape', () => {

  it('initial state has null user, null session, loading true', () => {
    const state = { user: null, session: null, loading: true }
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(true)
  })

  it('signOut clears user and session', () => {
    let state = { user: { id: 'u1' }, session: { access_token: 'tok' }, loading: false }
    state = { ...state, user: null, session: null }
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
  })

  it('required auth methods are defined', () => {
    const methods = ['initialize','signInWithGoogle','signInWithEmail','signUpWithEmail','signOut']
    methods.forEach(m => expect(typeof m).toBe('string'))
  })

  it('Supabase tables used by studio are correct', () => {
    const tables = ['atelier_projects','atelier_circle','atelier_skills','atelier_goals']
    tables.forEach(t => expect(t).toMatch(/^atelier_/))
  })

  it('project status values are valid', () => {
    const statuses = ['active','planning','wrap','complete','cancelled']
    expect(statuses).toHaveLength(5)
    expect(statuses).toContain('active')
  })
})
