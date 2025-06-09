interface TypographyProps {
  children: React.ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label' | 'link'
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'error'
  className?: string
}

export default function Typography({
  children,
  variant = 'body',
  color = 'primary',
  className = ''
}: TypographyProps) {
  const variantClasses = {
    h1: 'text-lg font-semibold',
    h2: 'text-base font-semibold',
    h3: 'text-sm font-medium',
    body: 'text-sm',
    caption: 'text-xs',
    label: 'text-xs uppercase tracking-wide',
    link: 'text-xs underline'
  }

  const colorClasses = {
    primary: 'text-black',
    secondary: 'text-gray-600',
    muted: 'text-gray-400',
    accent: 'text-blue-600',
    error: 'text-red-500'
  }

  const classes = `${variantClasses[variant]} ${colorClasses[color]} ${className}`

  return (
    <span className={classes}>
      {children}
    </span>
  )
}