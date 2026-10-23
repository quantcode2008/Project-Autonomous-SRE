export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  )
}
