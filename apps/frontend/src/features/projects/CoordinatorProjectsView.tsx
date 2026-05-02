import { useEffect, useState } from 'react'
import { AlertTriangle, Users, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { fetchProjects, updateProjectStatus } from './api'
import { getCurrentSemester } from '@/lib/getCurrentSemester'
import type { Project, ProjectStatus } from './types'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  ABANDONED: 'Abandonado',
  ONGOING: 'Contínuo',
  INCOMPLETE: 'Incompleto',
}

const STATUS_TONE: Record<ProjectStatus, 'blue' | 'green' | 'red' | 'yellow' | 'slate'> = {
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  ABANDONED: 'red',
  ONGOING: 'yellow',
  INCOMPLETE: 'yellow',
}

const ALL_STATUSES: ProjectStatus[] = [
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
  'ONGOING',
  'INCOMPLETE',
]

function getLatestSemester(project: Project): string {
  if (project.teams.length === 0) return ''
  return [...project.teams].sort((a, b) => b.semester.localeCompare(a.semester))[0].semester
}

function isPendingProject(project: Project, currentSemester: string): boolean {
  return project.status === 'IN_PROGRESS' && getLatestSemester(project) < currentSemester
}

interface StatusChangeModalProps {
  project: Project | null
  onClose: () => void
  onConfirm: (status: ProjectStatus) => Promise<void>
  saving: boolean
  error: string | null
}

function StatusChangeModal({ project, onClose, onConfirm, saving, error }: StatusChangeModalProps) {
  // State is initialized from props; the parent resets this component via key={project?.id}
  const [selected, setSelected] = useState<ProjectStatus>(project?.status ?? 'IN_PROGRESS')
  const [confirming, setConfirming] = useState(false)

  const willReleaseOsc = selected === 'COMPLETED' || selected === 'ABANDONED'
  const needsConfirmation = willReleaseOsc && !confirming

  function handleContinue() {
    if (needsConfirmation) {
      setConfirming(true)
      return
    }
    onConfirm(selected)
  }

  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar status do projeto</DialogTitle>
          {project && (
            <DialogDescription>
              Projeto: <strong>{project.name}</strong>
            </DialogDescription>
          )}
        </DialogHeader>

        {confirming ? (
          <div className="space-y-3 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/40 dark:bg-yellow-950/20">
            <p className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Ao definir o status como <strong>{STATUS_LABEL[selected]}</strong>, a OSC{' '}
                <strong>{project?.osc.name}</strong> será liberada como disponível para novos
                projetos.
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ALL_STATUSES.map((status) => (
              <label
                key={status}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={selected === status}
                  onChange={() => setSelected(status)}
                  className="accent-primary"
                />
                <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
              </label>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={confirming ? () => setConfirming(false) : onClose}
            disabled={saving}
          >
            {confirming ? 'Voltar' : 'Cancelar'}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={saving || selected === project?.status}
            variant={confirming && willReleaseOsc ? 'danger' : 'default'}
          >
            {saving ? 'Salvando...' : confirming ? 'Confirmar' : 'Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ProjectCardProps {
  project: Project
  isPending: boolean
  onChangeStatus: (project: Project) => void
}

function ProjectCard({ project, isPending, onChangeStatus }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      className={
        isPending
          ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-800/50 dark:bg-yellow-950/10'
          : ''
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isPending && (
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              )}
              <CardTitle className="truncate text-base">{project.name}</CardTitle>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{project.osc.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
            <Button variant="outline" size="sm" onClick={() => onChangeStatus(project)}>
              Alterar status
            </Button>
          </div>
        </div>
      </CardHeader>

      {project.teams.length > 0 && (
        <CardContent className="pt-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <Users className="h-3.5 w-3.5" />
            {project.teams.length} {project.teams.length === 1 ? 'equipe' : 'equipes'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {[...project.teams]
                .sort((a, b) => b.semester.localeCompare(a.semester))
                .map((team) => (
                  <div key={team.id} className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">
                        Semestre {team.semester} — código{' '}
                        <span className="font-mono">{team.code}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {team.members.length}{' '}
                        {team.members.length === 1 ? 'membro' : 'membros'}
                      </span>
                    </div>
                    {team.members.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {team.members.map((m) => m.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

export function CoordinatorProjectsView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const [statusTarget, setStatusTarget] = useState<Project | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  const currentSemester = getCurrentSemester()

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => setError('Não foi possível carregar os projetos.'))
      .finally(() => setLoading(false))
  }, [retryCount])

  function handleRetry() {
    setLoading(true)
    setError(null)
    setRetryCount((c) => c + 1)
  }

  async function handleStatusChange(newStatus: ProjectStatus) {
    if (!statusTarget) return
    setStatusSaving(true)
    setStatusError(null)
    try {
      const updated = await updateProjectStatus(statusTarget.id, newStatus)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setStatusTarget(null)
    } catch {
      setStatusError('Não foi possível alterar o status do projeto.')
    } finally {
      setStatusSaving(false)
    }
  }

  const currentProjects = projects.filter(
    (p) => getLatestSemester(p) === currentSemester || p.teams.length === 0,
  )
  const pastProjects = projects.filter(
    (p) => p.teams.length > 0 && getLatestSemester(p) < currentSemester,
  )

  const pendingCount = projects.filter((p) => isPendingProject(p, currentSemester)).length

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={handleRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerenciamento de projetos e equipes do programa.
          </p>
        </div>
        {!loading && pendingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-sm text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-950/20 dark:text-yellow-300">
            <AlertTriangle className="h-4 w-4" />
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Current semester */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Semestre atual — {currentSemester}
        </h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : currentProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto no semestre atual.</p>
        ) : (
          <div className="space-y-3">
            {currentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isPending={isPendingProject(project, currentSemester)}
                onChangeStatus={setStatusTarget}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past semesters */}
      {!loading && pastProjects.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Semestres anteriores
          </h2>
          <div className="space-y-3">
            {pastProjects
              .sort((a, b) => getLatestSemester(b).localeCompare(getLatestSemester(a)))
              .map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isPending={isPendingProject(project, currentSemester)}
                  onChangeStatus={setStatusTarget}
                />
              ))}
          </div>
        </section>
      )}

      {/* key resets selected/confirming state each time a new project is targeted */}
      <StatusChangeModal
        key={statusTarget?.id ?? 'none'}
        project={statusTarget}
        onClose={() => {
          setStatusTarget(null)
          setStatusError(null)
        }}
        onConfirm={handleStatusChange}
        saving={statusSaving}
        error={statusError}
      />
    </div>
  )
}
