'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { FAQItem } from '@/types'

function FAQAccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion()
  const panelId = `faq-panel-${item.id}`
  const headingId = `faq-heading-${item.id}`

  return (
    <div className="border-b border-ice/10 last:border-b-0">
      <h3>
        <button
          id={headingId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer group"
        >
          <span className="text-h3 text-offwhite group-hover:text-amber transition-colors">{item.question}</span>
          <span
            aria-hidden="true"
            className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-ice/20 transition-transform duration-300
              ${isOpen ? 'rotate-45 bg-amber border-amber' : 'bg-transparent'}`}
          >
            <svg className={`w-3.5 h-3.5 ${isOpen ? 'text-navy-DEFAULT' : 'text-ice'}`} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="2" x2="7" y2="12" />
              <line x1="2" y1="7" x2="12" y2="7" />
            </svg>
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <p className="text-body text-frost pb-5 max-w-[65ch]">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="divide-y divide-ice/10">
      {items.map((item) => (
        <FAQAccordionItem
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}
    </div>
  )
}
