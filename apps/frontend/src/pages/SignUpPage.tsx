import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthContext'
import type { ApiError } from '@/lib/types'

interface FormState {
  name: string
  email: string
  password: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = 'Nome obrigatório'
  if (!form.email) {
    errors.email = 'E-mail obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'E-mail inválido'
  }
  if (!form.password) errors.password = 'Senha obrigatória'
  return errors
}

const API_ERRORS: Record<number, string> = {
  403: 'Cadastro desabilitado no momento',
  409: 'E-mail já cadastrado',
}

export function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await signUp(form.name.trim(), form.email, form.password)
      navigate('/sign-in', { replace: true })
    } catch (err) {
      const apiErr = err as ApiError
      setApiError(API_ERRORS[apiErr.status] ?? 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-primary-700">Juntos pelo Impacto</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie sua conta de aluno</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                id="name"
                type="text"
                label="Nome"
                autoComplete="name"
                value={form.name}
                onChange={handleChange('name')}
                error={errors.name}
                disabled={loading}
              />
              <Input
                id="email"
                type="email"
                label="E-mail"
                autoComplete="email"
                value={form.email}
                onChange={handleChange('email')}
                error={errors.email}
                disabled={loading}
              />
              <Input
                id="password"
                type="password"
                label="Senha"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
                disabled={loading}
              />

              {apiError && (
                <p className="text-sm text-destructive">{apiError}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Criando conta…' : 'Criar conta'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/sign-in" className="font-medium text-primary-700 hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
