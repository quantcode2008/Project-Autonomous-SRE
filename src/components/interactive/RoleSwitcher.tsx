'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ROLES } from '@/lib/constants'
import { Button } from '@/components/core/Button'
import Link from 'next/link'

export function RoleSwitcher() {
  const reduce = useReducedMotion()
  const [activeRole, setActiveRole] = useState(ROLES[0].id)

  // Check UTM or referrer on mount to auto-select role
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const utm = params.get('utm_role') || params.get('role')
    if (utm) {
      const match = ROLES.find(r => r.id === utm.toLowerCase())
      if (match) setActiveRole(match.id)
    }

    // Remember chosen role in session
    const saved = sessionStorage.getItem('sentinel-role')
    if (saved && ROLES.find(r => r.id === saved)) {
      setActiveRole(saved)
    }
  }, [])

  // Save role to session
  useEffect(() => {
    sessionStorage.setItem('sentinel-role', activeRole)
  }, [activeRole])

  const current = ROLES.find(r => r.id === activeRole) || ROLES[0]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Select your role">
        {ROLES.map((role) => (
          <button
            key={role.id}
            role="tab"
            aria-selected={activeRole === role.id}
            aria-controls={`panel-${role.id}`}
            id={`tab-${role.id}`}
            onClick={() => setActiveRole(role.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-display font-medium transition-all cursor-pointer
              ${activeRole === role.id
                ? 'bg-amber text-navy-DEFAULT'
                : 'bg-navy-light/60 text-slate border border-ice/15 hover:border-ice/40 hover:text-offwhite'
              }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          id={`panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${current.id}`}
          aria-live="polite"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="card-glass p-8 md:p-10"
        >
          <h3 className="text-h2 text-offwhite mb-6">{current.headline}</h3>
          <ul className="space-y-4 mb-8">
            {current.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3 text-body text-frost">
                <svg className="h-5 w-5 text-amber shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
          <div>
            <Link href={`/register?role=${current.id}`}>
              <Button variant="primary" size="md">
                {current.cta}
              </Button>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
