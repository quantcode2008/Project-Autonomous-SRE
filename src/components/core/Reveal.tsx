'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  duration?: number
  stagger?: number
  once?: boolean
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 40,
  duration = 0.8,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      gsap.from(el, {
        y,
        opacity: 0,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once,
        },
      })
    })

    return () => ctx.revert()
  }, [y, duration, delay, once])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/* Staggered children reveal */
interface RevealGroupProps {
  children: React.ReactNode
  className?: string
  stagger?: number
  y?: number
}

export function RevealGroup({ children, className = '', stagger = 0.08, y = 40 }: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const items = el.children

    const ctx = gsap.context(() => {
      gsap.from(items, {
        y,
        opacity: 0,
        duration: 0.7,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      })
    })

    return () => ctx.revert()
  }, [stagger, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
