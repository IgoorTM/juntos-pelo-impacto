import { useEffect, useRef, useState } from 'react'
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

const ALLOWED_PATTERN = /[^A-Z2-9]/g

interface JoinTeamModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (code: string) => void | Promise<void>
  loading?: boolean
  error?: string | null
}

export function JoinTeamModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}: JoinTeamModalProps) {
  const [code, setCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
      .toUpperCase()
      .replace(ALLOWED_PATTERN, '')
      .slice(0, 6)
    setCode(next)
  }

  async function handleSubmit() {
    await onSubmit(code)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return
    onClose()
    setCode('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent role="dialog" initialFocus={inputRef}>
        <DialogHeader>
          <DialogTitle>Entrar em equipe</DialogTitle>
          <DialogDescription>
            Já tem o código da equipe? Informe-o para participar de um projeto já criado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-code">Código (6 caracteres)</Label>
            <Input
              ref={inputRef}
              id="team-code"
              value={code}
              onChange={handleCodeChange}
              placeholder="Ex: ABC234"
              maxLength={6}
              disabled={loading}
              className="font-mono tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Use letras (A-Z) e números (2-9). Exclui 0, O, I, 1.
            </p>
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
          <Button onClick={handleSubmit} disabled={loading || code.length !== 6}>
            Entrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
