import { Section } from '@/components/core/Section'
import { Reveal } from '@/components/core/Reveal'
import { Marquee } from '@/components/interactive/Marquee'

export function Integrations() {
  return (
    <Section id="integrations" ariaLabel="Integrations">
      <Reveal>
        <h2 className="text-h2 text-offwhite mb-4 text-center">
          Plugs into your stack.
        </h2>
        <p className="text-body text-frost max-w-xl mx-auto text-center mb-12">
          SentinelAI integrates with the tools your team already uses. No rip-and-replace.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <Marquee />
      </Reveal>
    </Section>
  )
}
