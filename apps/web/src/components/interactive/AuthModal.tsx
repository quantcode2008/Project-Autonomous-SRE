'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/core/Button'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.')
        }
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (signUpError) {
          throw new Error(signUpError.message || 'Unable to create account.')
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        })
        if (signInError) {
          throw new Error(signInError.message || 'Invalid email or password.')
        }
      }

      onClose()
      setEmail('')
      setPassword('')
      setName('')
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-DEFAULT/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-2xl bg-navy-light border border-ice/20 p-6 md:p-8 shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate hover:text-offwhite transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header / Tabs */}
            <div className="text-center mb-6">
              <h2 id="auth-modal-title" className="text-2xl font-display font-bold text-offwhite mb-2">
                {mode === 'signin' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-xs text-frost">
                {mode === 'signin'
                  ? 'Access your SentinelAI dashboard and incident controls.'
                  : 'Start protecting your services with an autonomous SRE.'}
              </p>

              {/* Mode Toggle */}
              <div className="flex rounded-lg bg-navy-DEFAULT/70 p-1 border border-ice/10 mt-5">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError('') }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'signin'
                      ? 'bg-amber text-navy-DEFAULT shadow-sm font-semibold'
                      : 'text-frost hover:text-offwhite'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError('') }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'signup'
                      ? 'bg-amber text-navy-DEFAULT shadow-sm font-semibold'
                      : 'text-frost hover:text-offwhite'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 rounded-lg bg-destructive/15 border border-destructive/40 p-3 text-xs text-destructive flex items-center gap-2"
                role="alert"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="auth-name">
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Johnson"
                    className="w-full rounded-xl bg-navy-DEFAULT/90 border border-ice/20 px-3.5 py-2.5 text-offwhite placeholder:text-slate text-sm
                               focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="auth-email">
                  Work Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@acme.corp"
                  className="w-full rounded-xl bg-navy-DEFAULT/90 border border-ice/20 px-3.5 py-2.5 text-offwhite placeholder:text-slate text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="auth-password">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-navy-DEFAULT/90 border border-ice/20 px-3.5 py-2.5 text-offwhite placeholder:text-slate text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
                />
              </div>

              <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
