import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
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
  description: string
  email: string
  phone: string
  status: OscStatus
}

const EMPTY_FORM: OscFormState = {
  name: '',
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={set('name')}
            disabled={saving}
            required
          />
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Descrição</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              disabled={saving}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
          <Input
            label="E-mail (opcional)"
            type="email"
            value={form.email}
            onChange={set('email')}
            disabled={saving}
          />
          <Input
            label="Telefone (opcional)"
            value={form.phone}
            onChange={set('phone')}
            disabled={saving}
          />
          {showStatus && (
            <div className="space-y-1">
              <label className="text-sm font-medium leading-none">Status</label>
              <select
                value={form.status}
                onChange={set('status')}
                disabled={saving}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="AVAILABLE">Disponível</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="BLOCKED">Bloqueada</option>
              </select>
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
              {saving ? 'Salvando...' : 'Salvar'}
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
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
      </CardContent>
    </Card>
  )
}

interface OscCardProps {
  osc: Osc
  onEdit: (osc: Osc) => void
}

function OscCard({ osc, onEdit }: OscCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{osc.name}</p>
            <Badge tone={OSC_STATUS_TONE[osc.status]} className="mt-1">
              {OSC_STATUS_LABEL[osc.status]}
            </Badge>
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
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{osc.description}</p>
        {(osc.email || osc.phone) && (
          <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
            {osc.email && <p>{osc.email}</p>}
            {osc.phone && <p>{osc.phone}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OscsPage() {
  const [oscs, setOscs] = useState<Osc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OscStatus | ''>('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<Osc | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchOscs()
      .then(setOscs)
      .catch(() => setError('Não foi possível carregar as OSCs.'))
      .finally(() => setLoading(false))
  }, [retryCount])

  function handleRetry() {
    setLoading(true)
    setError(null)
    setRetryCount((c) => c + 1)
  }

  async function handleCreate(form: OscFormState) {
    setCreating(true)
    setCreateError(null)
    const dto: CreateOscDto = {
      name: form.name.trim(),
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

  const filteredOscs = oscs
    .filter((o) => !search || o.name.toLowerCase().includes(search.toLowerCase()))
    .filter((o) => !statusFilter || o.status === statusFilter)

  const editInitial: OscFormState | undefined = editTarget
    ? {
        name: editTarget.name,
        description: editTarget.description,
        email: editTarget.email ?? '',
        phone: editTarget.phone ?? '',
        status: editTarget.status,
      }
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OSCs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organizações da Sociedade Civil parceiras do programa.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar OSC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OscStatus | '')}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="AVAILABLE">Disponível</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="BLOCKED">Bloqueada</option>
        </select>
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
          ) : filteredOscs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {oscs.length === 0 ? 'Nenhuma OSC cadastrada.' : 'Nenhuma OSC encontrada para os filtros aplicados.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredOscs.map((osc) => (
                <OscCard key={osc.id} osc={osc} onEdit={setEditTarget} />
              ))}
            </div>
          )}
        </>
      )}

      {/* key resets internal form state each time the dialog opens */}
      <OscFormDialog
        key={createOpen ? 'create-open' : 'create-closed'}
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setCreateError(null)
        }}
        onSave={handleCreate}
        title="Nova OSC"
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
