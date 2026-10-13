'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from '@/components/core/Button'

export function EmailForm({ ctaText = 'Get early access' }: { ctaText?: string }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = 'email-error'
  const inputId = 'email-input'

  const validate = (value: string) => {
    if (!value) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
    return ''
  }

  const fireConfetti = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // SentinelAI brand palette: warm amber, sunset gold, ice blue, offwhite
    const colors = ['#E8943A', '#F4C76B', '#7EB8DA', '#F0F2F5']
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors,
        disableForReducedMotion: true,
      })
    } catch {
      // Graceful fallback if confetti fails
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate(email)
    if (validationError) {
      setError(validationError)
      inputRef.current?.focus()
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unable to submit email. Please try again.')
      }

      setConfirmationMessage(data.message || "You're on the list. We'll be in touch.")
      setSubmitted(true)
      fireConfetti()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
      inputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError(validate(e.target.value))
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex items-center gap-3 rounded-full bg-success/15 border border-success/40 px-6 py-3.5 backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        <svg className="h-5 w-5 text-success shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-offwhite font-medium text-sm">
          {confirmationMessage || "You're on the list. We'll be in touch with early access."}
        </span>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 w-full max-w-lg">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">Work email address</label>
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            value={email}
            disabled={isSubmitting}
            onChange={handleChange}
            placeholder="you@company.com"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            aria-busy={isSubmitting}
            className="w-full rounded-full bg-navy-light/90 border border-ice/20 px-5 py-3.5 text-offwhite placeholder:text-slate text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all shadow-inner"
          />
        </div>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#0A1628]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Submitting...</span>
            </span>
          ) : (
            ctaText
          )}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-sm pl-4 flex items-center gap-1.5 font-medium">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </form>
  )
}
