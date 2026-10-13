import { Section } from '@/components/core/Section'
import { TrustStripClient } from './TrustStripClient'

export function TrustStrip() {
  return (
    <Section className="py-12 md:py-16 border-y border-ice/10 bg-navy-light/30" ariaLabel="Trusted by engineering teams">
      <TrustStripClient />
    </Section>
  )
}
