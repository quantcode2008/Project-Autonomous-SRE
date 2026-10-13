import { Section } from '@/components/core/Section'
import { Reveal } from '@/components/core/Reveal'
import { FAQ } from '@/components/interactive/FAQ'
import { EmailForm } from '@/components/interactive/EmailForm'
import { FAQ_ITEMS } from '@/lib/constants'

export function FAQSection() {
  return (
    <Section id="faq" ariaLabel="Frequently asked questions">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: heading + CTA */}
        <Reveal>
          <div className="lg:sticky lg:top-32 self-start">
            <p className="text-caption text-amber mb-4">Questions</p>
            <h2 className="text-h2 text-offwhite mb-6">
              Got questions? We&apos;ve got answers.
            </h2>
            <p className="text-body text-frost mb-8 max-w-md">
              If your question isn&apos;t here, reach out. We respond to every message.
            </p>
            <div className="max-w-md">
              <EmailForm ctaText="Get early access" />
            </div>
          </div>
        </Reveal>

        {/* Right: accordion */}
        <Reveal delay={0.15}>
          <FAQ items={FAQ_ITEMS} />
        </Reveal>
      </div>
    </Section>
  )
}
