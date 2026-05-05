import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface TeamCodeModalProps {
  open: boolean
  code: string
  semester: string
  onClose: () => void
}

export function TeamCodeModal({
  open,
  code,
  semester,
  onClose,
}: TeamCodeModalProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent role="dialog">
        <DialogHeader>
          <DialogTitle>Projeto criado!</DialogTitle>
          <DialogDescription>
            Compartilhe este código com sua equipe para que entrem no projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-950/20">
            <p className="mb-2 text-xs text-muted-foreground">Código da equipe</p>
            <p className="font-mono text-3xl font-bold tracking-widest text-foreground">
              {code}
            </p>
          </div>

          <Button variant="outline" onClick={handleCopy} className="w-full">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Semestre: <strong>{semester}</strong>
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Voltar aos meus projetos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
