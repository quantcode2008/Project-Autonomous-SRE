'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from '@/lib/auth-client'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/core/Button'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  isApproved: boolean
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const { data: sessionData, isPending } = useSession()
  const user = sessionData?.user

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isAdmin = user && ((user as any).role === 'ADMIN' || user.email === 'mirajmisba1@gmail.com')

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const res = await apiClient.get<{ data: AdminUser[] }>('/api/v1/admin/users?limit=100')
      setUsers(res.data || [])
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to fetch user list from backend.',
      })
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  const handleApprove = async (id: string, email: string) => {
    setActionLoading(id)
    try {
      await apiClient.patch(`/api/v1/admin/users/${id}/approve`)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isApproved: true } : u))
      )
      setNotification({
        type: 'success',
        message: `Approved ${email}! They can now sign in with ease.`,
      })
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to approve user.',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (id: string, email: string) => {
    setActionLoading(id)
    try {
      await apiClient.patch(`/api/v1/admin/users/${id}/reject`)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isApproved: false } : u))
      )
      setNotification({
        type: 'success',
        message: `Revoked access for ${email}.`,
      })
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to revoke user approval.',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Auto-dismiss notification after 4s
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 4000)
    return () => clearTimeout(timer)
  }, [notification])

  if (isPending) {
    return (
      <div className="min-h-screen bg-navy-DEFAULT flex items-center justify-center">
        <div className="text-frost text-sm flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Verifying administrator privileges...</span>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-navy-DEFAULT flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mb-5">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-bold text-offwhite mb-2">
          Administrator Access Required
        </h1>
        <p className="text-sm text-frost max-w-md mb-6">
          This portal manages tenant permissions and early access approvals. Please sign in with an authorized administrator account (e.g. mirajmisba1@gmail.com).
        </p>
        <div className="flex gap-4">
          <Link href="/signin">
            <Button variant="primary">Sign In as Admin</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Return Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalUsers = users.length
  const pendingUsers = users.filter((u) => !u.isApproved && u.role !== 'ADMIN')
  const approvedUsers = users.filter((u) => u.isApproved)

  const filteredUsers = users.filter((u) => {
    if (filter === 'pending') return !u.isApproved && u.role !== 'ADMIN'
    if (filter === 'approved') return u.isApproved
    return true
  })

  return (
    <div className="min-h-screen bg-navy-DEFAULT text-offwhite flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-ice/10 bg-navy-DEFAULT/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-offwhite font-display font-bold text-lg">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#E8943A" />
                <path d="M8 14l4 4 8-8" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>SentinelAI</span>
            </Link>
            <span className="text-xs font-mono uppercase tracking-wider text-amber bg-amber/15 border border-amber/30 px-2.5 py-0.5 rounded-full font-semibold">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-frost bg-navy-light/90 border border-ice/20 px-3 py-1.5 rounded-full hidden sm:inline-block">
              {user.email} (Admin)
            </span>
            <Link href="/">
              <Button size="sm" variant="ghost">
                Home
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                signOut().then(() => router.push('/signin'))
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast / Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg ${
                notification.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-destructive/15 border border-destructive/40 text-destructive'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="hover:opacity-75 ml-4"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-offwhite">
              User Approvals & Access Control
            </h1>
            <p className="text-sm text-frost mt-1">
              Review registered users and approve their sign-in privileges for the early access platform.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchUsers}
            disabled={loading}
            className="self-start sm:self-auto border border-ice/20"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="card-glass p-5 rounded-2xl border border-ice/15">
            <span className="text-xs text-frost font-mono uppercase tracking-wider">Total Users</span>
            <p className="text-3xl font-display font-bold text-offwhite mt-2">{totalUsers}</p>
            <span className="text-[11px] text-slate mt-1 block">Registered in database</span>
          </div>

          <div className="card-glass p-5 rounded-2xl border border-amber/40 bg-amber/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber font-mono uppercase tracking-wider font-semibold">
                Pending Approval
              </span>
              {pendingUsers.length > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber"></span>
                </span>
              )}
            </div>
            <p className="text-3xl font-display font-bold text-amber mt-2">{pendingUsers.length}</p>
            <span className="text-[11px] text-frost mt-1 block">Require administrator review</span>
          </div>

          <div className="card-glass p-5 rounded-2xl border border-ice/15">
            <span className="text-xs text-frost font-mono uppercase tracking-wider">Approved Access</span>
            <p className="text-3xl font-display font-bold text-emerald-400 mt-2">{approvedUsers.length}</p>
            <span className="text-[11px] text-slate mt-1 block">Can sign in immediately</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-ice/10 pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-amber text-navy-DEFAULT font-semibold shadow-sm'
                : 'bg-navy-light/60 text-frost hover:text-offwhite border border-ice/10'
            }`}
          >
            All Registrations ({totalUsers})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === 'pending'
                ? 'bg-amber text-navy-DEFAULT font-semibold shadow-sm'
                : 'bg-navy-light/60 text-frost hover:text-offwhite border border-ice/10'
            }`}
          >
            Pending Approvals ({pendingUsers.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === 'approved'
                ? 'bg-amber text-navy-DEFAULT font-semibold shadow-sm'
                : 'bg-navy-light/60 text-frost hover:text-offwhite border border-ice/10'
            }`}
          >
            Approved Users ({approvedUsers.length})
          </button>
        </div>

        {/* Users Table */}
        <div className="card-glass rounded-2xl border border-ice/15 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-light/90 border-b border-ice/10 text-xs font-mono uppercase text-frost">
                <tr>
                  <th scope="col" className="px-6 py-4">User</th>
                  <th scope="col" className="px-6 py-4">Role</th>
                  <th scope="col" className="px-6 py-4">Email OTP Verified</th>
                  <th scope="col" className="px-6 py-4">Admin Status</th>
                  <th scope="col" className="px-6 py-4">Registered</th>
                  <th scope="col" className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-frost">
                      Loading user records...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate">
                      No users found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelfAdmin = u.email === 'mirajmisba1@gmail.com'
                    return (
                      <tr key={u.id} className="hover:bg-navy-light/40 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          <div className="text-offwhite font-semibold">{u.name || 'Anonymous'}</div>
                          <div className="text-xs text-frost font-mono">{u.email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-mono uppercase ${
                              u.role === 'ADMIN'
                                ? 'bg-amber/20 text-amber font-semibold border border-amber/30'
                                : 'bg-ice/10 text-frost border border-ice/20'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {u.emailVerified ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Unverified
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {u.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                              ● Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber/15 border border-amber/30 text-amber">
                              ⏳ Pending Review
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-frost font-mono">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isSelfAdmin ? (
                            <span className="text-xs text-slate italic">Super Admin</span>
                          ) : !u.isApproved ? (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={actionLoading === u.id}
                              onClick={() => handleApprove(u.id, u.email)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-offwhite border-0"
                            >
                              {actionLoading === u.id ? 'Approving...' : 'Approve Access'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={actionLoading === u.id}
                              onClick={() => handleRevoke(u.id, u.email)}
                              className="text-destructive hover:bg-destructive/15 border border-destructive/30"
                            >
                              {actionLoading === u.id ? 'Revoking...' : 'Revoke'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
