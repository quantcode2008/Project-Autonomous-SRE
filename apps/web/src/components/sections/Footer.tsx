import { Container } from '@/components/core/Container'
import { FOOTER_LINKS } from '@/lib/constants'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-ice/10 bg-navy-light/20" role="contentinfo">
      <Container>
        <div className="py-16 md:py-20">
          {/* Footer grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div>
              <h4 className="text-sm font-display font-semibold text-offwhite mb-4">Product</h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-frost/70 hover:text-offwhite transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-display font-semibold text-offwhite mb-4">Company</h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-frost/70 hover:text-offwhite transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-display font-semibold text-offwhite mb-4">Resources</h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.resources.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-frost/70 hover:text-offwhite transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-display font-semibold text-offwhite mb-4">Legal</h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-frost/70 hover:text-offwhite transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-ice/10">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect width="28" height="28" rx="6" fill="#E8943A" />
                <path d="M8 14l4 4 8-8" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-frost/50 font-display">SentinelAI</span>
            </div>
            <p className="text-xs text-frost/40">
              &copy; {currentYear} SentinelAI. All rights reserved. {/* placeholder */}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
