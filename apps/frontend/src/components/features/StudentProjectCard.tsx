import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Project, ProjectStatus } from '@/features/projects/types'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  ABANDONED: 'Incompleto',
}

const STATUS_DOT: Record<ProjectStatus, string> = {
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  ABANDONED: 'bg-red-400',
}

const STATUS_TONE: Record<ProjectStatus, 'blue' | 'green' | 'red'> = {
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  ABANDONED: 'red',
}

interface StudentProjectCardProps {
  project: Project
}

export function StudentProjectCard({ project }: StudentProjectCardProps) {
  const [copied, setCopied] = useState(false)
  const latestTeam = project.teams.length > 0 ? project.teams[0] : null

  async function handleCopyCode() {
    if (!latestTeam) return
    await navigator.clipboard.writeText(latestTeam.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const memberCount = latestTeam ? latestTeam.members.length : 0
  const otherMembersCount = memberCount > 0 ? memberCount - 1 : 0

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge tone={STATUS_TONE[project.status]}>
          <span
            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_DOT[project.status]}`}
          />
          {STATUS_LABEL[project.status]}
        </Badge>
      </div>

      <div className="mt-3">
        <p className="text-base font-semibold text-foreground">{project.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          para{' '}
          <span className="font-semibold text-foreground">{project.osc.name}</span>
        </p>
      </div>

      {latestTeam && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            <span>{latestTeam.code}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy code"
              className="ml-1 rounded p-0.5 hover:bg-muted-foreground/20"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <span className="text-xs text-muted-foreground">{latestTeam.semester}</span>
          {memberCount > 0 && (
            <span className="text-xs text-muted-foreground">
              Você {otherMembersCount > 0 ? `+ ${otherMembersCount}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
