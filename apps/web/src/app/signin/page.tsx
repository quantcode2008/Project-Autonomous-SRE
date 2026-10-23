'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/core/Button'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await signIn.email({
        email,
        password,
      })

      if (signInError) {
        throw new Error(signInError.message || 'Invalid credentials or access rejected.')
      }

      // If admin, route to admin console, otherwise home
      if (email.toLowerCase() === 'mirajmisba1@gmail.com' || (data?.user as any)?.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-DEFAULT flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Brand Header */}
      <div className="mb-8 text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 text-offwhite font-display font-bold text-2xl group">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="group-hover:scale-105 transition-transform">
            <rect width="28" height="28" rx="6" fill="#E8943A" />
            <path d="M8 14l4 4 8-8" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>SentinelAI</span>
        </Link>
        <p className="text-xs text-frost mt-2 font-mono tracking-wide uppercase">
          Autonomous Incident Response Portal
        </p>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md card-glass p-8 md:p-10 shadow-2xl border border-ice/15 z-10"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-offwhite">
            Sign In to SentinelAI
          </h1>
          <p className="text-xs text-frost mt-1.5">
            Enter your approved credentials to access your autonomous SRE monitors.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mb-5 rounded-xl p-3.5 text-xs flex items-start gap-2.5 ${
              error.includes('approval') || error.includes('awaiting')
                ? 'bg-amber/15 border border-amber/40 text-amber'
                : 'bg-destructive/15 border border-destructive/30 text-destructive'
            }`}
          >
            <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="signin-email">
              Work Email Address
            </label>
            <input
              id="signin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-xl bg-navy-light/90 border border-ice/20 px-4 py-3 text-offwhite placeholder:text-slate text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-frost" htmlFor="signin-password">
                Password
              </label>
            </div>
            <input
              id="signin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl bg-navy-light/90 border border-ice/20 px-4 py-3 text-offwhite placeholder:text-slate text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full mt-4 shadow-lg shadow-amber/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-[#0A1628]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-ice/10 text-center">
          <p className="text-xs text-frost">
            Don&apos;t have early access yet?{' '}
            <Link href="/register" className="text-amber hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
