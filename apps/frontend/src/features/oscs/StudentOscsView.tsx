import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StudentOscCard } from '@/components/features/StudentOscCard'
import { CreateProjectModal } from '@/components/features/modals/CreateProjectModal'
import type { CreateProjectInput } from '@/components/features/modals/CreateProjectModal'
import { TeamCodeModal } from '@/components/features/modals/TeamCodeModal'
import { useAsync } from '@/lib/useAsync'
import { fetchOscs } from './api'
import { createProject } from '@/features/projects/api'
import type { Osc, OscListPage } from './types'

export function StudentOscsView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOsc, setSelectedOsc] = useState<Osc | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [generatedSemester, setGeneratedSemester] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const { data, loading, error, execute } = useAsync<OscListPage>()

  useEffect(() => {
    execute(() =>
      fetchOscs({
        page: 1,
        limit: 50,
        status: 'AVAILABLE',
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      }),
    )
    // execute is intentionally omitted: useAsync re-creates it each render and
    // including it would cause an infinite fetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  function handleInitiateProject(osc: Osc) {
    setSelectedOsc(osc)
    setCreateError(null)
    setShowCreateModal(true)
  }

  async function handleCreateProject(input: CreateProjectInput) {
    setCreateLoading(true)
    setCreateError(null)
    try {
      const project = await createProject(input)
      const team = project.teams[0]
      if (team) {
        setGeneratedCode(team.code)
        setGeneratedSemester(team.semester)
        setShowCreateModal(false)
        setShowCodeModal(true)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao criar projeto'
      setCreateError(message)
    } finally {
      setCreateLoading(false)
    }
  }

  function handleCodeModalClose() {
    setShowCodeModal(false)
    navigate('/projects')
  }

  const oscs = data?.data ?? []
  const oscCount = oscs.length

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error.message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            execute(() =>
              fetchOscs({ page: 1, limit: 50, status: 'AVAILABLE' }),
            )
          }
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OSCs disponíveis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conheça as organizações parceiras abertas a novos projetos. Selecione
          uma para iniciar um projeto.
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar OSC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {!loading && (
          <p className="text-xs text-muted-foreground">
            {oscCount} {oscCount === 1 ? 'organização' : 'organizações'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-5">
              <Skeleton className="mb-2 h-6 w-48" />
              <Skeleton className="mb-3 h-4 w-32" />
              <Skeleton className="mb-3 h-20" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : oscCount === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Nenhuma OSC encontrada com esse nome.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {oscs.map((osc) => (
            <StudentOscCard
              key={osc.id}
              osc={osc}
              onInitiate={handleInitiateProject}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        key={selectedOsc?.id ?? 'none'}
        open={showCreateModal}
        osc={selectedOsc}
        onClose={() => {
          setShowCreateModal(false)
          setCreateError(null)
        }}
        onSubmit={handleCreateProject}
        loading={createLoading}
        error={createError}
      />

      <TeamCodeModal
        open={showCodeModal}
        code={generatedCode}
        semester={generatedSemester}
        onClose={handleCodeModalClose}
      />
    </div>
  )
}
