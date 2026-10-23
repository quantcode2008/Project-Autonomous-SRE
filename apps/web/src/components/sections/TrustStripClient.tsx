'use client'

import { RevealGroup } from '@/components/core/Reveal'
import { TRUST_LOGOS, TRUST_METRICS } from '@/lib/constants'

export function TrustStripClient() {
  return (
    <div className="space-y-10">
      {/* Logo row */}
      <RevealGroup className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {TRUST_LOGOS.map((name) => (
          <span
            key={name}
            className="text-slate/50 font-display font-semibold text-lg tracking-wide"
            title={`${name} — placeholder`}
          >
            {name} {/* placeholder */}
          </span>
        ))}
      </RevealGroup>

      {/* Metric cards */}
      <RevealGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {TRUST_METRICS.map((metric) => (
          <div
            key={metric.label}
            className="card-glass text-center py-6 px-4"
          >
            <div className="text-3xl md:text-4xl font-display font-bold text-amber mb-2">
              {metric.value} {/* placeholder */}
            </div>
            <div className="text-caption text-slate">{metric.label}</div>
          </div>
        ))}
      </RevealGroup>
    </div>
  )
}
