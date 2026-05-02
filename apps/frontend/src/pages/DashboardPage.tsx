import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Building2, FolderKanban, AlertTriangle, TrendingUp, Lock, Unlock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchDashboard, toggleSignUp } from '@/features/dashboard/api'
import type { DashboardData } from '@/features/dashboard/types'

interface MetricCardProps {
  title: string
  value: number
  icon: React.ReactNode
}

function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError('Não foi possível carregar os dados do painel.'))
      .finally(() => setLoading(false))
  }, [retryCount])

  function handleRetry() {
    setLoading(true)
    setError(null)
    setRetryCount((c) => c + 1)
  }

  async function handleToggleSignUp() {
    if (!data) return
    setToggling(true)
    try {
      const result = await toggleSignUp(!data.signUp.enabled)
      setData((prev) =>
        prev
          ? {
              ...prev,
              signUp: { ...prev.signUp, enabled: result.signUpEnabled, updatedAt: new Date().toISOString() },
            }
          : prev,
      )
    } catch {
      // silently ignore — user will see the stale state
    } finally {
      setToggling(false)
    }
  }

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
      <div>
        <h1 className="text-2xl font-bold">Painel do Coordenador</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral do programa.</p>
      </div>

      {/* Metrics grid */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Métricas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                title="Total de OSCs"
                value={data?.totalOscs ?? 0}
                icon={<Building2 className="h-4 w-4" />}
              />
              <MetricCard
                title="Projetos Ativos"
                value={data?.activeProjects ?? 0}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <MetricCard
                title="OSCs Bloqueadas"
                value={data?.blockedOscs ?? 0}
                icon={<Lock className="h-4 w-4" />}
              />
              <MetricCard
                title="OSCs Disponíveis"
                value={data?.availableOscs ?? 0}
                icon={<Building2 className="h-4 w-4" />}
              />
            </>
          )}
        </div>
      </section>

      {/* Pending projects alert */}
      {!loading && data && data.pendingProjects > 0 && (
        <section>
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-950/20">
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div>
                <CardTitle className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  Projetos pendentes de encerramento
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-400">
                  {data.pendingProjects}{' '}
                  {data.pendingProjects === 1 ? 'projeto continua' : 'projetos continuam'} em
                  andamento com equipes de semestres anteriores.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link to="/projects">
                <Button variant="outline" size="sm">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Ver projetos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Sign-up control */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Controle de cadastro
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastro público de alunos</CardTitle>
            <CardDescription>
              Quando habilitado, alunos podem criar contas pelo formulário de cadastro.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            {loading ? (
              <>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-9 w-28" />
              </>
            ) : (
              <>
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {data?.signUp.enabled ? (
                      <>
                        <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-400">Cadastro aberto</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-red-700 dark:text-red-400">Cadastro fechado</span>
                      </>
                    )}
                  </p>
                  {data?.signUp.updatedAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Última alteração:{' '}
                      {new Date(data.signUp.updatedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <Button
                  variant={data?.signUp.enabled ? 'outline' : 'default'}
                  size="sm"
                  onClick={handleToggleSignUp}
                  disabled={toggling}
                >
                  {toggling
                    ? 'Salvando...'
                    : data?.signUp.enabled
                      ? 'Desabilitar cadastro'
                      : 'Habilitar cadastro'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
