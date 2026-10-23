import { Section } from '@/components/core/Section'
import { Reveal } from '@/components/core/Reveal'
import { Terminal } from '@/components/interactive/Terminal'

export function TerminalDemo() {
  return (
    <Section id="demo" ariaLabel="Live incident response demo">
      <Reveal>
        <h2 className="text-h2 text-offwhite mb-4 max-w-2xl">
          Watch an incident resolve itself.
        </h2>
        <p className="text-body text-frost max-w-xl mb-12">
          From alert to verified PR in under 20 seconds. This is what autonomous reliability looks like. {/* placeholder timing */}
        </p>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="max-w-4xl">
          <Terminal />
        </div>
      </Reveal>
    </Section>
  )
}
