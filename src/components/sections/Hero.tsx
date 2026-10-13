import Image from 'next/image'
import { Container } from '@/components/core/Container'
import { HeroContent } from './HeroContent'

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Background image — PLAIN, no effects */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt="An astronaut walking from a frozen blue world into a warm sunset farmland, representing the journey from cold production outages to warm resolution"
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-[25%_center] md:object-center"
        />
      </div>

      {/* Content positioned over the dark-blue left sky */}
      <Container className="relative z-10 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-xl lg:max-w-2xl">
          <HeroContent />
        </div>
      </Container>
    </section>
  )
}
