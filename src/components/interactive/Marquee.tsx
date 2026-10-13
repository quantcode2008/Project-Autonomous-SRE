'use client'

import { useRef, useEffect } from 'react'
import { INTEGRATIONS } from '@/lib/constants'

export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion && trackRef.current) {
      trackRef.current.style.animationPlayState = 'paused'
    }
  }, [])

  // Duplicate items for seamless loop
  const items = [...INTEGRATIONS, ...INTEGRATIONS]

  return (
    <div
      className="relative overflow-hidden"
      role="marquee"
      aria-label="Integration partners"
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy-DEFAULT to-transparent z-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-navy-DEFAULT to-transparent z-10" aria-hidden="true" />

      <div
        ref={trackRef}
        className="flex gap-12 md:gap-16 animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
        style={{ width: 'max-content' }}
      >
        {items.map((integration, i) => (
          <div
            key={`${integration.name}-${i}`}
            className="flex items-center gap-3 shrink-0 py-4"
          >
            {/* Integration icon from Simple Icons CDN */}
            <img
              src={`https://cdn.simpleicons.org/${integration.icon}/7EB8DA`}
              alt=""
              width={28}
              height={28}
              className="opacity-60 hover:opacity-100 transition-opacity"
              loading="lazy"
            />
            <span className="text-frost/70 font-display font-medium text-lg whitespace-nowrap">{integration.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
