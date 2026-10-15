'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Container } from '@/components/core/Container'
import { Button } from '@/components/core/Button'
import { NAV_LINKS } from '@/lib/constants'
import { useSession, signOut } from '@/lib/auth-client'
import { AuthModal } from '@/components/interactive/AuthModal'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { data: sessionData } = useSession()
  const user = sessionData?.user
  const { scrollY } = useScroll()
  const reduce = useReducedMotion()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 100)
  })

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-navy-DEFAULT/90 backdrop-blur-lg border-b border-ice/10 py-3'
          : 'bg-transparent py-5'
      }`}
      initial={reduce ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Container>
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-offwhite font-display font-bold text-xl" aria-label="SentinelAI home">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="6" fill="#E8943A" />
              <path d="M8 14l4 4 8-8" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            SentinelAI
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-frost hover:text-offwhite transition-colors font-body relative group"
              >
                {link.label}
                <span className="absolute left-0 -bottom-1 w-0 h-px bg-amber group-hover:w-full transition-all duration-300" aria-hidden="true" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="#demo"
              className="text-sm text-frost hover:text-offwhite transition-colors font-body"
            >
              Watch demo
            </a>
            {user ? (
              <div className="flex items-center gap-3">
                {((user as any).role === 'ADMIN' || user.email === 'mirajmisba1@gmail.com') && (
                  <Link
                    href="/admin"
                    className="text-xs font-semibold text-amber bg-amber/10 border border-amber/30 px-3 py-1.5 rounded-full hover:bg-amber/20 transition-colors"
                  >
                    Admin Console
                  </Link>
                )}
                <span className="text-xs text-frost bg-navy-light/90 border border-ice/20 px-3 py-1.5 rounded-full font-medium">
                  {user.name || user.email}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/signin"
                  className="text-sm text-frost hover:text-offwhite transition-colors font-medium px-2 py-1"
                >
                  Sign In
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get early access
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden relative w-10 h-10 flex items-center justify-center cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={`block absolute h-0.5 w-6 bg-offwhite transition-all duration-300 ${mobileOpen ? 'rotate-45' : '-translate-y-2'}`} />
            <span className={`block absolute h-0.5 w-6 bg-offwhite transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block absolute h-0.5 w-6 bg-offwhite transition-all duration-300 ${mobileOpen ? '-rotate-45' : 'translate-y-2'}`} />
          </button>
        </nav>
      </Container>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:hidden fixed inset-0 top-[60px] bg-navy-DEFAULT/95 backdrop-blur-xl z-40"
        >
          <div className="flex flex-col items-center justify-center gap-8 pt-20">
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 + 0.1 }}
                className="text-2xl font-display font-semibold text-offwhite"
              >
                {link.label}
              </motion.a>
            ))}
            {user ? (
              <div className="flex flex-col items-center gap-3">
                {((user as any).role === 'ADMIN' || user.email === 'mirajmisba1@gmail.com') && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-semibold text-amber bg-amber/10 border border-amber/30 px-4 py-2 rounded-full"
                  >
                    Admin Console
                  </Link>
                )}
                <span className="text-sm text-frost font-medium">{user.name || user.email}</span>
                <Button size="sm" variant="ghost" onClick={() => { setMobileOpen(false); signOut() }}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full max-w-xs px-6">
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="text-lg text-frost hover:text-offwhite font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full"
                >
                  <Button size="lg" className="w-full">
                    Get early access
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </motion.header>
  )
}
