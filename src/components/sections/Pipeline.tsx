'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Container } from '@/components/core/Container'
import { PIPELINE_STEPS } from '@/lib/constants'

gsap.registerPlugin(ScrollTrigger)

const STEP_ICONS: Record<string, ReactNode> = {
  detect: (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="14" cy="14" r="10" /><line x1="22" y1="22" x2="28" y2="28" strokeLinecap="round" />
    </svg>
  ),
  investigate: (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="16" cy="12" r="4" /><path d="M16 16v10" strokeLinecap="round" /><path d="M10 20l6-4 6 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  reproduce: (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 16a10 10 0 0118-6" strokeLinecap="round" /><path d="M26 16a10 10 0 01-18 6" strokeLinecap="round" /><polyline points="24,4 24,10 18,10" strokeLinecap="round" strokeLinejoin="round" /><polyline points="8,28 8,22 14,22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  fix: (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 4l-2 8 8-2-6 6 8 2-2 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  prevent: (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 4l10 4v8c0 6-4 10-10 12C10 26 6 22 6 16V8l10-4z" strokeLinejoin="round" /><path d="M11 16l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export function Pipeline() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const stepsEl = stepsRef.current
    if (!section || !stepsEl) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const steps = stepsEl.querySelectorAll('.pipeline-step')

    const ctx = gsap.context(() => {
      // Pin the section while steps reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${steps.length * 300}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      steps.forEach((step, i) => {
        if (i === 0) return // First step is visible by default
        tl.from(step, {
          opacity: 0,
          y: 40,
          duration: 1,
          ease: 'power2.out',
        }, i * 0.8)
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="pipeline"
      className="relative min-h-[100dvh] flex items-center bg-navy-light/20"
      aria-label="How SentinelAI works — 5-step pipeline"
    >
      <Container>
        <div className="py-20 md:py-32">
          <h2 className="text-h2 text-offwhite mb-4 max-w-2xl">
            From alert to verified fix, autonomously.
          </h2>
          <p className="text-body text-frost max-w-xl mb-16">
            Five steps. Zero human intervention required. Full audit trail at every stage.
          </p>

          <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {PIPELINE_STEPS.map((step, i) => (
              <div
                key={step.id}
                className="pipeline-step card-glass p-6 relative"
              >
                {/* Step number + connector */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center text-amber">
                    {STEP_ICONS[step.id]}
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 w-6 h-px bg-ice/20" aria-hidden="true" />
                  )}
                </div>

                <span className="text-caption text-amber mb-2 block">Step {i + 1}</span>
                <h3 className="text-h3 text-offwhite mb-3">{step.title}</h3>
                <p className="text-sm text-frost leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
