import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useSocialStore = create((set, get) => ({
  friends:       [],
  pending:       [],   // incoming friend requests
  notifications: [],
  feed:          [],
  unreadCount:   0,
  loading:       false,

  // ── Friends ──────────────────────────────────────────────────
  loadFriends: async (userId) => {
    const { data } = await supabase
      .from('friendships')
      .select('*, requester:requester_id(id, email, raw_user_meta_data), addressee:addressee_id(id, email, raw_user_meta_data)')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted')
    set({ friends: data ?? [] })
  },

  loadPending: async (userId) => {
    const { data } = await supabase
      .from('friendships')
      .select('*, requester:requester_id(id, email, raw_user_meta_data)')
      .eq('addressee_id', userId)
      .eq('status', 'pending')
    set({ pending: data ?? [] })
  },

  sendFriendRequest: async (targetId) => {
    const { data, error } = await supabase.rpc('send_friend_request', { target_id: targetId })
    return { data, error }
  },

  acceptFriendRequest: async (requesterId) => {
    const { data, error } = await supabase.rpc('accept_friend_request', { requester: requesterId })
    if (!error) {
      set(s => ({ pending: s.pending.filter(p => p.requester_id !== requesterId) }))
    }
    return { data, error }
  },

  declineFriendRequest: async (requesterId, userId) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', requesterId)
      .eq('addressee_id', userId)
    set(s => ({ pending: s.pending.filter(p => p.requester_id !== requesterId) }))
  },

  unfriend: async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    set(s => ({ friends: s.friends.filter(f => f.id !== friendshipId) }))
  },

  // ── Notifications ────────────────────────────────────────────
  loadNotifications: async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    const unread = (data ?? []).filter(n => !n.read).length
    set({ notifications: data ?? [], unreadCount: unread })
  },

  markAllRead: async (userId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },

  markRead: async (notifId) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notifId)
    set(s => ({
      notifications: s.notifications.map(n => n.id === notifId ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  // ── Activity Feed ────────────────────────────────────────────
  loadFeed: async () => {
    const { data } = await supabase.rpc('get_friend_feed', { p_limit: 30, p_offset: 0 })
    set({ feed: data ?? [] })
  },

  postActivity: async (userId, eventType, payload, visibility = 'friends') => {
    const { user } = (await supabase.auth.getUser()).data
    await supabase.from('activity_feed').insert({
      user_id:    userId,
      actor_name: user?.user_metadata?.full_name || user?.email,
      event_type: eventType,
      payload,
      visibility,
    })
  },

  // ── Groups ───────────────────────────────────────────────────
  createGroup: async (userId, { name, description, coverEmoji, privacy }) => {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, description, cover_emoji: coverEmoji ?? '✦', privacy: privacy ?? 'private', created_by: userId })
      .select()
      .single()
    if (error) return { error }
    await supabase.from('group_members').insert({ group_id: group.id, user_id: userId, role: 'admin' })
    return { data: group }
  },

  // ── Gamification ─────────────────────────────────────────────
  awardBadge: async (slug, context = {}) => {
    return supabase.rpc('award_badge', { p_badge_slug: slug, p_context: context })
  },

  addPoints: async (points, reason, referenceId = null) => {
    return supabase.rpc('add_points', { p_points: points, p_reason: reason, p_reference_id: referenceId })
  },
}))
