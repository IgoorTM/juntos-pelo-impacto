import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ActionCardProps {
  title: string
  description: string
  buttonLabel: string
  onClick: () => void
  disabled?: boolean
  icon?: ReactNode
}

export function ActionCard({
  title,
  description,
  buttonLabel,
  onClick,
  disabled = false,
  icon,
}: ActionCardProps) {
  return (
    <div
      className={`rounded-lg border bg-card p-5 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-xl">{icon}</div>}
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="mt-3"
      >
        {buttonLabel} →
      </Button>
    </div>
  )
}
