'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import { Button } from '@/components/core/Button'

export function HeroContent() {
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const sublineRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.5 })

      tl.from(headlineRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
      .from(sublineRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      }, '-=0.4')
      .from(ctaRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      }, '-=0.3')
    })

    return () => ctx.revert()
  }, [])

  return (
    <>
      <h1
        ref={headlineRef}
        className="text-display text-offwhite mb-6"
      >
        Your 3&nbsp;a.m. pager, resolved.
      </h1>

      <p
        ref={sublineRef}
        className="text-body text-frost max-w-[50ch] mb-8"
      >
        SentinelAI detects, investigates, reproduces, fixes, and prevents production bugs — so your team ships features, not hotfixes.
      </p>

      <div ref={ctaRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <Link href="/register">
          <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-amber/20 group">
            <span>Get early access</span>
            <svg
              className="w-4 h-4 ml-2 inline-block group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Button>
        </Link>
        <a
          href="#demo"
          className="inline-flex items-center gap-2 text-sm text-frost hover:text-offwhite transition-colors font-body group w-fit px-3 py-2"
        >
          <svg className="w-4 h-4 text-amber" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.707 8.707l-4 4a1 1 0 01-1.414-1.414L9.586 8 6.293 4.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414z" />
          </svg>
          Watch the demo
          <span className="block w-0 h-px bg-amber group-hover:w-full transition-all duration-300" aria-hidden="true" />
        </a>
      </div>
    </>
  )
}
