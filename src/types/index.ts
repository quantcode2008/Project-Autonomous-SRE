export interface PipelineStep {
  id: string
  title: string
  description: string
  icon: string
}

export interface RoleContent {
  id: string
  label: string
  headline: string
  benefits: string[]
  cta: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface BentoFeature {
  id: string
  title: string
  description: string
  icon: string
  span: 'normal' | 'wide' | 'tall'
}

export interface Integration {
  name: string
  icon: string
}

export interface TerminalLine {
  text: string
  type: 'info' | 'warning' | 'error' | 'success' | 'command' | 'output'
  delay: number
}
