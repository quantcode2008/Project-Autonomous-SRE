import { Header } from '@/components/sections/Header'
import { Hero } from '@/components/sections/Hero'
import { TrustStrip } from '@/components/sections/TrustStrip'
import { ProblemSolution } from '@/components/sections/ProblemSolution'
import { Pipeline } from '@/components/sections/Pipeline'
import { TerminalDemo } from '@/components/sections/TerminalDemo'
import { RoleSection } from '@/components/sections/RoleSection'
import { BentoGrid } from '@/components/sections/BentoGrid'
import { Integrations } from '@/components/sections/Integrations'
import { FAQSection } from '@/components/sections/FAQSection'
import { Footer } from '@/components/sections/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <TrustStrip />
        <ProblemSolution />
        <Pipeline />
        <TerminalDemo />
        <RoleSection />
        <BentoGrid />
        <Integrations />
        <FAQSection />
      </main>
      <Footer />
    </>
  )
}
