import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { BookOpen, Users, RefreshCw, AlertCircle } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { fetchStudentProjects } from './api'
import { ActionCard } from '@/components/features/ActionCard'
import { StudentProjectCard } from '@/components/features/StudentProjectCard'
import { JoinTeamModal } from '@/components/features/modals/JoinTeamModal'
import { TeamCodeModal } from '@/components/features/modals/TeamCodeModal'
import { joinTeam } from '@/features/teams/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getCurrentSemester } from '@/lib/getCurrentSemester'
import type { Project } from './types'

export function StudentProjectsView() {
  const navigate = useNavigate()
  const [joinTeamOpen, setJoinTeamOpen] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinLoading, setJoinLoading] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [joinedTeamCode, setJoinedTeamCode] = useState('')
  const [joinedTeamSemester, setJoinedTeamSemester] = useState('')

  const { data: projects, loading, error, execute } = useAsync<Project[]>()

  function loadProjects() {
    execute(() => fetchStudentProjects())
  }

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentSemester = getCurrentSemester()
  const currentProjects = (projects ?? []).filter(
    (p) => p.teams.length > 0 && p.teams[0].semester === currentSemester,
  )

  function handleCreateProject() {
    navigate('/oscs-disponiveis')
  }

  async function handleJoinTeam(code: string) {
    setJoinLoading(true)
    setJoinError(null)
    try {
      const team = await joinTeam(code)
      setJoinedTeamCode(team.code)
      setJoinedTeamSemester(team.semester)
      setJoinTeamOpen(false)
      setShowCodeModal(true)
      loadProjects()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao entrar na equipe'
      setJoinError(message)
    } finally {
      setJoinLoading(false)
    }
  }

  function handleCodeModalClose() {
    setShowCodeModal(false)
    setJoinedTeamCode('')
    setJoinedTeamSemester('')
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error.message}</p>
        <Button variant="outline" className="mt-4" onClick={loadProjects}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Seus projetos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe o progresso da sua equipe ou inicie um novo projeto junto a
          uma OSC parceira.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ActionCard
          icon={<BookOpen className="h-5 w-5" />}
          title="Criar novo projeto"
          description="Inicie um projeto junto a uma OSC disponível. Você recebe um código para compartilhar com sua equipe."
          buttonLabel="Começar"
          onClick={handleCreateProject}
        />
        <ActionCard
          icon={<Users className="h-5 w-5" />}
          title="Entrar em equipe"
          description="Já tem o código da equipe? Informe-o para participar de um projeto já criado."
          buttonLabel="Informar código"
          onClick={() => setJoinTeamOpen(true)}
        />
        <ActionCard
          icon={<RefreshCw className="h-5 w-5" />}
          title="Continuar projeto"
          description="Projetos com status Em continuação ou Incompleto podem ser retomados por uma nova equipe."
          buttonLabel="Ver disponíveis"
          onClick={() => {}}
          disabled
        />
      </div>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Meus projetos neste semestre
          </h2>
          <span className="text-xs text-muted-foreground">
            {loading ? 0 : currentProjects.length}{' '}
            {currentProjects.length === 1 ? 'projeto' : 'projetos'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-5">
                <Skeleton className="mb-3 h-6 w-28 rounded-full" />
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="mb-4 h-4 w-36" />
                <Skeleton className="h-5 w-32 rounded-md" />
              </div>
            ))}
          </div>
        ) : currentProjects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Você ainda não participa de nenhum projeto.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleCreateProject}
            >
              Ir para OSCs disponíveis
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currentProjects.map((project) => (
              <StudentProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <JoinTeamModal
        open={joinTeamOpen}
        onClose={() => {
          setJoinTeamOpen(false)
          setJoinError(null)
        }}
        onSubmit={handleJoinTeam}
        loading={joinLoading}
        error={joinError}
      />

      <TeamCodeModal
        open={showCodeModal}
        code={joinedTeamCode}
        semester={joinedTeamSemester}
        onClose={handleCodeModalClose}
      />
    </div>
  )
}
