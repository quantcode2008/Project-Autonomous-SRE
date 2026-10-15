'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from '@/components/core/Button'
import { apiClient, ApiError } from '@/lib/api-client'

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'otp' | 'pending'>('form')

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Status State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const fireSuccessConfetti = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const colors = ['#E8943A', '#F4C76B', '#7EB8DA', '#F0F2F5']
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors,
      })
    } catch {
      // Graceful fallback
    }
  }

  // Handle Initial Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      const res = await apiClient.post<{
        success: boolean
        message: string
        devOtp?: string
      }>('/api/v1/auth/register', {
        name,
        email,
        password,
      })

      if (res.devOtp) {
        setDevOtp(res.devOtp)
      }

      setInfoMessage(res.message || `We sent a 6-digit verification code to ${email}`)
      setStep('otp')
      setResendCooldown(30)
    } catch (err: any) {
      setError(err?.message || 'Failed to submit registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Inputs
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Support paste of 6 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 6)
      if (cleaned.length === 6) {
        const newOtp = cleaned.split('')
        setOtp(newOtp)
        otpInputRefs.current[5]?.focus()
        return
      }
    }

    const digit = value.slice(-1).replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // Handle OTP Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await apiClient.post<{ success: boolean; message: string }>(
        '/api/v1/auth/register/verify-otp',
        {
          email,
          otp: otpCode,
        }
      )

      fireSuccessConfetti()
      setStep('pending')
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)

    try {
      const res = await apiClient.post<{
        success: boolean
        message: string
        devOtp?: string
      }>('/api/v1/auth/register/resend-otp', { email })

      if (res.devOtp) {
        setDevOtp(res.devOtp)
      }

      setInfoMessage('A new verification code has been dispatched.')
      setResendCooldown(45)
    } catch (err: any) {
      setError(err?.message || 'Could not resend code. Please try again.')
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
      <div
        className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-ice/5 rounded-full blur-[100px] pointer-events-none"
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
          Autonomous SRE Early Access Registration
        </p>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-lg z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: Registration Form */}
          {step === 'form' && (
            <motion.div
              key="step-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="card-glass p-8 md:p-10 shadow-2xl border border-ice/15"
            >
              <div className="mb-6">
                <h1 className="text-2xl font-display font-bold text-offwhite">
                  Join the Early Access Program
                </h1>
                <p className="text-sm text-frost mt-1.5">
                  Register your account. Once verified and approved by our team, your autonomous incident response workspace will be provisioned.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl bg-destructive/15 border border-destructive/30 p-3.5 text-xs text-destructive flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="reg-name">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full rounded-xl bg-navy-light/90 border border-ice/20 px-4 py-3 text-offwhite placeholder:text-slate text-sm
                               focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="reg-email">
                    Work Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@acmecorp.com"
                    className="w-full rounded-xl bg-navy-light/90 border border-ice/20 px-4 py-3 text-offwhite placeholder:text-slate text-sm
                               focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="reg-password">
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl bg-navy-light/90 border border-ice/20 px-4 py-3 text-offwhite placeholder:text-slate text-sm
                                 focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-frost mb-1.5" htmlFor="reg-confirm">
                      Confirm Password
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl bg-navy-light/90 border border-ice/20 px-4 py-3 text-offwhite placeholder:text-slate text-sm
                                 focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
                    />
                  </div>
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
                      <span>Sending OTP...</span>
                    </span>
                  ) : (
                    'Continue with Email Verification'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-ice/10 text-center">
                <p className="text-xs text-frost">
                  Already registered and approved?{' '}
                  <Link href="/signin" className="text-amber hover:underline font-medium">
                    Sign in to your account
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="card-glass p-8 md:p-10 shadow-2xl border border-ice/15"
            >
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber/15 border border-amber/30 text-amber flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-offwhite">
                  Enter Verification Code
                </h2>
                <p className="text-xs text-frost mt-2 max-w-sm mx-auto">
                  We sent a 6-digit confirmation code to <span className="text-amber font-semibold">{email}</span>. Please enter it below.
                </p>
              </div>

              {/* Dev Mode Code Assist */}
              {devOtp && (
                <div className="mb-5 rounded-xl bg-amber/10 border border-amber/30 p-3 text-xs text-amber flex items-center justify-between">
                  <span className="font-mono">
                    <strong className="font-bold">[Dev Mode Code]:</strong> {devOtp}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtp.split('')
                      setOtp(digits)
                    }}
                    className="underline text-[11px] font-semibold hover:text-offwhite cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl bg-destructive/15 border border-destructive/30 p-3.5 text-xs text-destructive flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && !error && (
                <div className="mb-5 rounded-xl bg-ice/10 border border-ice/20 p-3 text-xs text-frost flex items-center gap-2">
                  <svg className="w-4 h-4 text-ice shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{infoMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6 Digit Input Boxes */}
                <div className="flex justify-center gap-2.5 sm:gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-mono font-bold rounded-xl bg-navy-light/90 border border-ice/20 text-offwhite
                                 focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all shadow-inner"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full shadow-lg shadow-amber/20"
                >
                  {loading ? 'Verifying OTP...' : 'Verify Code & Proceed'}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-xs text-frost pt-4 border-t border-ice/10">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="hover:text-offwhite transition-colors"
                >
                  ← Edit registration info
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-amber hover:underline font-medium disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Pending Admin Approval */}
          {step === 'pending' && (
            <motion.div
              key="step-pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="card-glass p-8 md:p-10 shadow-2xl border border-amber/30 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber/20 border-2 border-amber flex items-center justify-center mx-auto mb-5 text-amber">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              <h2 className="text-2xl font-display font-bold text-offwhite mb-2">
                Verification Successful!
              </h2>

              <p className="text-amber text-xs font-semibold uppercase tracking-wider mb-4">
                Registration Awaiting Admin Approval
              </p>

              <p className="text-sm text-frost leading-relaxed max-w-md mx-auto mb-8">
                Your email address <strong className="text-offwhite">{email}</strong> has been successfully verified.
                <br /><br />
                To protect production environments and ensure tailored onboarding, all SentinelAI autonomous access tokens are reviewed by an administrator. Once approved, your account will be activated and you can sign in directly.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signin">
                  <Button variant="primary" size="md" className="w-full sm:w-auto">
                    Go to Sign In Page
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="md" className="w-full sm:w-auto">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
