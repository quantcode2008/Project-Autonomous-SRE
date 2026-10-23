'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { Section } from '@/components/core/Section'
import { Reveal, RevealGroup } from '@/components/core/Reveal'
import { BENTO_FEATURES } from '@/lib/constants'

const FEATURE_ICONS: Record<string, ReactNode> = {
  search: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  ),
  container: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 3v18" />
    </svg>
  ),
  test: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  ),
  gauge: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  ),
  log: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h6" strokeLinecap="round" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
}

function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`relative card-glass p-6 md:p-8 group overflow-hidden ${className}`}
      whileHover={reduce ? undefined : { y: -2, transition: { duration: 0.2 } }}
    >
      {/* Spotlight gradient overlay */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(232, 148, 58, 0.06), transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export function BentoGrid() {
  return (
    <Section id="features" ariaLabel="Features">
      <Reveal>
        <h2 className="text-h2 text-offwhite mb-4 max-w-2xl">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <p className="text-body text-frost max-w-xl mb-12">
          From root-cause analysis to verified fixes — a complete autonomous reliability toolkit.
        </p>
      </Reveal>

      <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-auto" stagger={0.06}>
        {BENTO_FEATURES.map((feature) => (
          <SpotlightCard
            key={feature.id}
            className={feature.span === 'wide' ? 'md:col-span-2 lg:col-span-2' : ''}
          >
            <div className="w-10 h-10 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center text-amber mb-4">
              {FEATURE_ICONS[feature.icon]}
            </div>
            <h3 className="text-h3 text-offwhite mb-2">{feature.title}</h3>
            <p className="text-sm text-frost leading-relaxed max-w-md">{feature.description}</p>
          </SpotlightCard>
        ))}
      </RevealGroup>
    </Section>
  )
}
