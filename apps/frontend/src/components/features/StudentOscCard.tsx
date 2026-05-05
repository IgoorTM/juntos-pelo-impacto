import { Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Osc } from '@/features/oscs/types'
import { OSC_CATEGORY_LABEL } from '@/features/oscs/types'

interface StudentOscCardProps {
  osc: Osc
  onInitiate: (osc: Osc) => void
}

function projectHistoryLabel(count: number): string {
  if (count === 0) return 'Sem histórico'
  if (count === 1) return '1 projeto no histórico'
  return `${count} projetos no histórico`
}

export function StudentOscCard({ osc, onInitiate }: StudentOscCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">{osc.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="green">{OSC_CATEGORY_LABEL[osc.category]}</Badge>
          </div>
        </div>
        <Badge tone="slate" className="shrink-0">
          Disponível
        </Badge>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{osc.description}</p>

      {(osc.email || osc.phone) && (
        <div className="mt-3 space-y-1">
          {osc.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {osc.email}
            </div>
          )}
          {osc.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {osc.phone}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {projectHistoryLabel(osc.projectCount)}
        </span>
        <Button
          size="sm"
          onClick={() => onInitiate(osc)}
          className="shrink-0"
        >
          + Iniciar projeto
        </Button>
      </div>
    </div>
  )
}
