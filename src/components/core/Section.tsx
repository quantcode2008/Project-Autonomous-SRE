import { Container } from './Container'

interface SectionProps {
  id?: string
  children: React.ReactNode
  className?: string
  as?: 'section' | 'div'
  ariaLabel?: string
}

export function Section({ id, children, className = '', as: Tag = 'section', ariaLabel }: SectionProps) {
  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      className={`py-20 md:py-32 ${className}`}
    >
      <Container>
        {children}
      </Container>
    </Tag>
  )
}
