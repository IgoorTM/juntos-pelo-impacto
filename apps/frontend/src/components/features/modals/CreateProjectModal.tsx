import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Osc } from '@/features/oscs/types'

export interface CreateProjectInput {
  name: string
  description: string
  oscId: string
}

interface CreateProjectModalProps {
  open: boolean
  osc: Osc | null
  onClose: () => void
  onSubmit: (data: CreateProjectInput) => void | Promise<void>
  loading?: boolean
  error?: string | null
}

export function CreateProjectModal({
  open,
  osc,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit() {
    if (!osc) return
    await onSubmit({ name, description, oscId: osc.id })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return
    onClose()
    setName('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent role="dialog">
        <DialogHeader>
          <DialogTitle>Criar novo projeto</DialogTitle>
          {osc && (
            <DialogDescription>
              Projeto para: <strong>{osc.name}</strong>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome do projeto</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Plataforma de Voluntariado"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">
              Descrição <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo do projeto..."
              rows={3}
              disabled={loading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Criar projeto…' : 'Criar projeto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
