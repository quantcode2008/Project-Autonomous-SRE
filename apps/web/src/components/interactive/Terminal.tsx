'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TERMINAL_LINES } from '@/lib/constants'

gsap.registerPlugin(ScrollTrigger)

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setVisibleLines(TERMINAL_LINES.length)
      return
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 70%',
        once: true,
        onEnter: () => {
          if (hasAnimated.current) return
          hasAnimated.current = true

          TERMINAL_LINES.forEach((line, i) => {
            setTimeout(() => {
              setVisibleLines(i + 1)
              // Auto-scroll terminal to bottom
              if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight
              }
            }, line.delay)
          })
        },
      })
    })

    return () => ctx.revert()
  }, [])

  const getLineColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-destructive'
      case 'success': return 'text-success'
      case 'warning': return 'text-amber'
      case 'command': return 'text-ice'
      default: return 'text-slate'
    }
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* Terminal window */}
      <div className="rounded-xl border border-ice/10 bg-[#0B0E14] overflow-hidden shadow-2xl shadow-navy-DEFAULT/50">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#0D1117] border-b border-ice/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70" aria-hidden="true" />
            <div className="w-3 h-3 rounded-full bg-amber/70" aria-hidden="true" />
            <div className="w-3 h-3 rounded-full bg-success/70" aria-hidden="true" />
          </div>
          <span className="text-xs text-slate font-mono ml-2">sentinel-ai — incident-response</span>
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          className="p-5 font-mono text-sm leading-relaxed h-[320px] md:h-[360px] overflow-y-auto"
          role="log"
          aria-label="Live incident response terminal"
          aria-live="polite"
        >
          {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${getLineColor(line.type)} whitespace-pre-wrap break-all`}
            >
              {line.text}
            </div>
          ))}
          {visibleLines < TERMINAL_LINES.length && visibleLines > 0 && (
            <span className="inline-block w-2 h-4 bg-ice/70 animate-pulse ml-1" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  )
}
