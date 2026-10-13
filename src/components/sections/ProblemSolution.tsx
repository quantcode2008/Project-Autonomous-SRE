'use client'

import { Section } from '@/components/core/Section'
import { Reveal } from '@/components/core/Reveal'

const PAIN_POINTS = [
  'Engineers jolted awake at 3 a.m. by cryptic alerts',
  'Hours spent reproducing bugs across inconsistent environments',
  'Fixes shipped under pressure with no regression tests',
  'The same bug resurfaces two sprints later',
  'MTTR measured in hours, not minutes', /* placeholder */
]

const SOLUTIONS = [
  'Anomalies caught and triaged before users notice',
  'Sandboxed reproduction in a deterministic Docker environment',
  'Every fix ships with auto-generated regression tests',
  'Prevention rules ensure the bug never returns',
  'MTTR measured in seconds, not hours', /* placeholder */
]

export function ProblemSolution() {
  return (
    <Section id="problem" ariaLabel="Problem and solution">
      <Reveal>
        <p className="text-caption text-amber mb-4">The Problem</p>
        <h2 className="text-h2 text-offwhite mb-4 max-w-3xl">
          Manual firefighting is burning out your best engineers.
        </h2>
        <p className="text-body text-frost max-w-2xl mb-12">
          Production incidents follow the same exhausting pattern. Alert, scramble, guess, patch, pray. SentinelAI breaks the cycle.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Pain column */}
        <Reveal delay={0.1}>
          <div className="card-glass p-8 border-destructive/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50" aria-hidden="true" />
            <h3 className="text-h3 text-destructive/80 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Without SentinelAI
            </h3>
            <ul className="space-y-4">
              {PAIN_POINTS.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-body text-frost/70">
                  <span className="text-destructive/60 mt-1 shrink-0" aria-hidden="true">&#x2717;</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Solution column */}
        <Reveal delay={0.2}>
          <div className="card-glass p-8 border-success/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-success/50" aria-hidden="true" />
            <h3 className="text-h3 text-success/80 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              With SentinelAI
            </h3>
            <ul className="space-y-4">
              {SOLUTIONS.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-body text-frost">
                  <span className="text-success mt-1 shrink-0" aria-hidden="true">&#x2713;</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
