import { useEffect, useState } from 'react'
import { Plus, Mail, Phone, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import type { SelectOption } from '@/components/ui/select'
import { fetchOscs, createOsc, updateOsc } from '@/features/oscs/api'
import type { Osc, OscStatus, CreateOscDto, UpdateOscDto } from '@/features/oscs/types'

const OSC_STATUS_LABEL: Record<OscStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_PROGRESS: 'Em andamento',
  BLOCKED: 'Bloqueada',
}

const OSC_STATUS_TONE: Record<OscStatus, 'green' | 'blue' | 'red'> = {
  AVAILABLE: 'green',
  IN_PROGRESS: 'blue',
  BLOCKED: 'red',
}

interface OscFormState {
  name: string
  category: string
  description: string
  email: string
  phone: string
  status: OscStatus
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos os status' },
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'BLOCKED', label: 'Bloqueada' },
]

const STATUS_FORM_OPTIONS: SelectOption[] = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'BLOCKED', label: 'Bloqueada' },
]

const EMPTY_FORM: OscFormState = {
  name: '',
  category: '',
  description: '',
  email: '',
  phone: '',
  status: 'AVAILABLE',
}

interface OscFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (form: OscFormState) => Promise<void>
  initial?: OscFormState
  title: string
  saving: boolean
  error: string | null
  showStatus?: boolean
}

function OscFormDialog({
  open,
  onClose,
  onSave,
  initial = EMPTY_FORM,
  title,
  saving,
  error,
  showStatus = false,
}: OscFormDialogProps) {
  const [form, setForm] = useState<OscFormState>(initial)
  const [validationError, setValidationError] = useState<string | null>(null)
  const isCreate = !showStatus

  function set(field: keyof OscFormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setValidationError('Nome é obrigatório.')
      return
    }
    if (!form.description.trim()) {
      setValidationError('Descrição é obrigatória.')
      return
    }
    setValidationError(null)
    await onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isCreate && (
            <div className="flex gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-3 text-sm text-blue-700">
              <span className="mt-0.5 shrink-0 text-blue-500">&#9432;</span>
              <p>
                O status inicial é sempre <strong>Disponível</strong>. Você pode ajustar depois se
                necessário.
              </p>
            </div>
          )}

          <Input
            label="Nome da OSC *"
            placeholder="Instituto Exemplo"
            value={form.name}
            onChange={set('name')}
            disabled={saving}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Área de atuação"
              placeholder="Ex: Educação"
              value={form.category}
              onChange={set('category')}
              disabled={saving}
            />
            <Input
              label="E-mail de contato"
              type="email"
              placeholder="contato@osc.org"
              value={form.email}
              onChange={set('email')}
              disabled={saving}
            />
          </div>

          <Input
            label="Telefone"
            placeholder="(11) 98888-7777"
            value={form.phone}
            onChange={set('phone')}
            disabled={saving}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Descrição *</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              disabled={saving}
              rows={4}
              placeholder="Missão, público atendido e área geográfica."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              required
            />
          </div>

          {showStatus && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Status</label>
              <Select
                value={form.status}
                onChange={(v) => setForm((prev) => ({ ...prev, status: (v ?? 'AVAILABLE') as OscStatus }))}
                options={STATUS_FORM_OPTIONS}
                disabled={saving}
                className="w-full"
              />
            </div>
          )}

          {(validationError || error) && (
            <p className="text-sm text-destructive">{validationError ?? error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : isCreate ? 'Cadastrar OSC' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OscCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-4/5" />
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

interface OscCardProps {
  osc: Osc
  onEdit: (osc: Osc) => void
}

function OscCard({ osc, onEdit }: OscCardProps) {
  const projectLabel =
    osc.projectCount === 1 ? '1 projeto vinculado' : `${osc.projectCount} projetos vinculados`

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-snug">{osc.name}</p>
            {osc.category && (
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {osc.category}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(osc)}
            aria-label={`Editar ${osc.name}`}
            className="shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{osc.description}</p>

        {(osc.email || osc.phone) && (
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {osc.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>{osc.email}</span>
              </div>
            )}
            {osc.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{osc.phone}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t pt-2.5">
          <Badge tone={OSC_STATUS_TONE[osc.status]}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
            {OSC_STATUS_LABEL[osc.status]}
          </Badge>
          <span className="text-sm text-muted-foreground">{projectLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}

const PAGE_LIMIT = 10

export function OscsPage() {
  const [oscs, setOscs] = useState<Osc[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OscStatus | ''>('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<Osc | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  // Debounce search input 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset and fetch page 1 whenever filters change
  useEffect(() => {
    let cancelled = false
    // Reset UI state synchronously so skeleton shows immediately instead of
    // displaying the empty-state text for one frame while the new fetch is in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    setLoadMoreError(null)
    setOscs([])
    setPage(1)
    setTotalPages(1)
    fetchOscs({
      page: 1,
      limit: PAGE_LIMIT,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter && { status: statusFilter }),
    })
      .then((resp) => {
        if (cancelled) return
        setOscs(resp.data)
        setTotalPages(resp.totalPages)
      })
      .catch(() => {
        if (cancelled) return
        setError('Não foi possível carregar as OSCs.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, statusFilter, retryTick])

  function handleRetry() {
    setError(null)
    setRetryTick((t) => t + 1)
  }

  async function handleLoadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const resp = await fetchOscs({
        page: nextPage,
        limit: PAGE_LIMIT,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
      })
      setOscs((prev) => [...prev, ...resp.data])
      setPage(nextPage)
      setTotalPages(resp.totalPages)
    } catch {
      setLoadMoreError('Não foi possível carregar mais OSCs. Tente novamente.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleCreate(form: OscFormState) {
    setCreating(true)
    setCreateError(null)
    const dto: CreateOscDto = {
      name: form.name.trim(),
      ...(form.category.trim() && { category: form.category.trim() }),
      description: form.description.trim(),
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.phone.trim() && { phone: form.phone.trim() }),
    }
    try {
      const created = await createOsc(dto)
      setOscs((prev) => [...prev, created])
      setCreateOpen(false)
    } catch (err: unknown) {
      const apiErr = err as { status?: number }
      setCreateError(
        apiErr?.status === 409 ? 'Já existe uma OSC com esse nome.' : 'Erro ao criar OSC.',
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleEdit(form: OscFormState) {
    if (!editTarget) return
    setEditing(true)
    setEditError(null)
    const dto: UpdateOscDto = {
      name: form.name.trim(),
      ...(form.category.trim() ? { category: form.category.trim() } : { category: undefined }),
      description: form.description.trim(),
      status: form.status,
      ...(form.email.trim() ? { email: form.email.trim() } : { email: undefined }),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : { phone: undefined }),
    }
    try {
      const updated = await updateOsc(editTarget.id, dto)
      setOscs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setEditTarget(null)
    } catch (err: unknown) {
      const apiErr = err as { status?: number }
      setEditError(
        apiErr?.status === 409 ? 'Já existe uma OSC com esse nome.' : 'Erro ao salvar alterações.',
      )
    } finally {
      setEditing(false)
    }
  }

  const editInitial: OscFormState | undefined = editTarget
    ? {
        name: editTarget.name,
        category: editTarget.category ?? '',
        description: editTarget.description,
        email: editTarget.email ?? '',
        phone: editTarget.phone ?? '',
        status: editTarget.status,
      }
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OSCs parceiras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre organizações e gerencie sua disponibilidade ao longo dos semestres.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-64 shrink-0">
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter((v ?? '') as OscStatus | '')}
          options={STATUS_OPTIONS}
          placeholder="Todos os status"
        />
        <Button onClick={() => setCreateOpen(true)} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova OSC
        </Button>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!error && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <OscCardSkeleton key={i} />
              ))}
            </div>
          ) : oscs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {!debouncedSearch && !statusFilter
                ? 'Nenhuma OSC cadastrada.'
                : 'Nenhuma OSC encontrada para os filtros aplicados.'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {oscs.map((osc) => (
                  <OscCard key={osc.id} osc={osc} onEdit={setEditTarget} />
                ))}
              </div>

              {page < totalPages && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? 'Carregando…' : 'Carregar mais'}
                  </Button>
                  {loadMoreError && (
                    <p className="text-sm text-destructive">{loadMoreError}</p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <OscFormDialog
        key={createOpen ? 'create-open' : 'create-closed'}
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setCreateError(null)
        }}
        onSave={handleCreate}
        title="Cadastrar nova OSC"
        saving={creating}
        error={createError}
      />

      <OscFormDialog
        key={editTarget?.id ?? 'edit-closed'}
        open={!!editTarget}
        onClose={() => {
          setEditTarget(null)
          setEditError(null)
        }}
        onSave={handleEdit}
        initial={editInitial}
        title="Editar OSC"
        saving={editing}
        error={editError}
        showStatus
      />
    </div>
  )
}
