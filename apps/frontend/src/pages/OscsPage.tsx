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

function OscRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-56" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-md" />
      </td>
    </tr>
  )
}

export function OscsPage() {
  const [oscs, setOscs] = useState<Osc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OSCs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organizações da Sociedade Civil parceiras do programa.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Descrição
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      E-mail
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <OscRowSkeleton key={i} />)
                  ) : oscs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        Nenhuma OSC cadastrada.
                      </td>
                    </tr>
                  ) : (
                    oscs.map((osc) => (
                      <tr key={osc.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{osc.name}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                          {osc.description}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{osc.email ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{osc.phone ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge tone={OSC_STATUS_TONE[osc.status]}>
                            {OSC_STATUS_LABEL[osc.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditTarget(osc)}
                            aria-label={`Editar ${osc.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
