import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  ABANDONED: 'Incompleto',
}

// Labels used on cards when the project belongs to a past semester section
const PAST_SECTION_LABEL: Record<ProjectStatus, string> = {
  IN_PROGRESS: 'Em continuação',
  COMPLETED: 'Concluído',
  ABANDONED: 'Incompleto',
}

const STATUS_DOT: Record<ProjectStatus, string> = {
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  ABANDONED: 'bg-red-400',
}

const PAST_SECTION_DOT: Record<ProjectStatus, string> = {
  IN_PROGRESS: 'bg-teal-500',
  COMPLETED: 'bg-green-500',
  ABANDONED: 'bg-red-400',
}

const ALL_STATUSES: ProjectStatus[] = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED']

function getLatestTeam(project: Project) {
  if (project.teams.length === 0) return null
  return [...project.teams].sort((a, b) => b.semester.localeCompare(a.semester))[0]
}

function getLatestSemester(project: Project): string {
  return getLatestTeam(project)?.semester ?? ''
}

function isPendingProject(project: Project, currentSemester: string): boolean {
  return project.status === 'IN_PROGRESS' && getLatestSemester(project) < currentSemester
}

// --- Sub-components ---

interface StatusBadgeProps {
  status: ProjectStatus
  pastSection?: boolean
}

function StatusBadge({ status, pastSection = false }: StatusBadgeProps) {
  const label = pastSection ? PAST_SECTION_LABEL[status] : STATUS_LABEL[status]
  const dot = pastSection ? PAST_SECTION_DOT[status] : STATUS_DOT[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-foreground dark:border-border dark:bg-card">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pendente
    </span>
  )
}

interface SectionHeaderProps {
  title: string
  count: number
  amber?: boolean
}

function SectionHeader({ title, count, amber = false }: SectionHeaderProps) {
  const unit = count === 1 ? 'projeto' : 'projetos'
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2
        className={`text-xs font-semibold uppercase tracking-widest ${amber ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
      >
        {title}
      </h2>
      <span className="text-xs text-muted-foreground">
        {count} {unit}
      </span>
    </div>
  )
}

// --- Modal ---

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

  const willReleaseOsc = selected === 'COMPLETED'
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
          <DialogTitle>Definir status do projeto</DialogTitle>
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
                <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                  {STATUS_LABEL[status]}
                </span>
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

// --- Project Card ---

interface ProjectCardProps {
  project: Project
  isPending: boolean
  pastSection?: boolean
  onChangeStatus: (project: Project) => void
}

function ProjectCard({ project, isPending, pastSection = false, onChangeStatus }: ProjectCardProps) {
  const latestTeam = getLatestTeam(project)

  return (
    <div
      className={`rounded-lg border bg-card p-5 ${
        isPending
          ? 'border-amber-200 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/10'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={project.status} pastSection={pastSection} />
          {isPending && <PendingBadge />}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onChangeStatus(project)}
        >
          Definir status
        </Button>
      </div>

      <div className="mt-3">
        <p className="text-base font-semibold text-foreground">{project.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          para <span className="font-semibold text-foreground">{project.osc.name}</span>
        </p>
      </div>

      {latestTeam && (
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {latestTeam.code}
          </span>
          <span className="text-xs text-muted-foreground">{latestTeam.semester}</span>
          {latestTeam.members.length > 0 && (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {latestTeam.members.map((m) => m.name).join(' · ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}

// --- Page ---

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

  const pendingProjects = projects.filter((p) => isPendingProject(p, currentSemester))
  const currentProjects = projects.filter(
    (p) => getLatestSemester(p) === currentSemester || p.teams.length === 0,
  )
  const pastProjects = projects.filter(
    (p) =>
      p.teams.length > 0 &&
      getLatestSemester(p) < currentSemester &&
      !isPendingProject(p, currentSemester),
  )

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
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-4xl font-bold text-foreground">Projetos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe projetos por semestre, defina status finais e resolva pendências do período
          anterior.
        </p>
      </div>

      {/* Pending projects */}
      {!loading && pendingProjects.length > 0 && (
        <section>
          <SectionHeader
            title="Pendentes de fechamento"
            count={pendingProjects.length}
            amber
          />
          <div className="space-y-3">
            {pendingProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isPending
                onChangeStatus={setStatusTarget}
              />
            ))}
          </div>
        </section>
      )}

      {/* Current semester */}
      <section>
        <SectionHeader title={`Semestre ${currentSemester}`} count={loading ? 0 : currentProjects.length} />
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : currentProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto no semestre atual.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isPending={false}
                onChangeStatus={setStatusTarget}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past semesters */}
      {!loading && pastProjects.length > 0 && (
        <section>
          <SectionHeader title="Semestres anteriores" count={pastProjects.length} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pastProjects
              .sort((a, b) => getLatestSemester(b).localeCompare(getLatestSemester(a)))
              .map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isPending={false}
                  pastSection
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
