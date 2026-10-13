import { Section } from '@/components/core/Section'
import { Reveal } from '@/components/core/Reveal'
import { RoleSwitcher } from '@/components/interactive/RoleSwitcher'

export function RoleSection() {
  return (
    <Section id="roles" ariaLabel="SentinelAI for your role">
      <Reveal>
        <p className="text-caption text-amber mb-4">Built For You</p>
        <h2 className="text-h2 text-offwhite mb-4 max-w-2xl">
          One product, tuned to your role.
        </h2>
        <p className="text-body text-frost max-w-xl mb-12">
          Whether you&apos;re writing code, managing infrastructure, or scaling a startup — SentinelAI adapts to how you work.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <RoleSwitcher />
      </Reveal>
    </Section>
  )
}
