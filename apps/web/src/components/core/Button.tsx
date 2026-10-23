'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  size?: 'default' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  ariaLabel?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const translateX = useTransform(x, (v) => (reduce ? 0 : v * 0.15))
  const translateY = useTransform(y, (v) => (reduce ? 0 : v * 0.15))

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduce) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const baseStyles = 'relative inline-flex items-center justify-center font-display font-semibold transition-colors cursor-pointer'

  const sizeStyles = size === 'sm'
    ? 'px-5 py-2.5 text-sm'
    : size === 'lg'
    ? 'px-8 py-4 text-base'
    : 'px-7 py-3.5 text-base'

  const variantStyles = variant === 'primary'
    ? 'bg-amber text-navy-DEFAULT hover:bg-amber-light rounded-full'
    : 'bg-transparent text-offwhite border border-ice/30 hover:border-ice/60 rounded-full'

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ x: translateX, y: translateY }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}
