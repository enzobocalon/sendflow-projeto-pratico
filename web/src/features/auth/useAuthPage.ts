import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'

type AuthMode = 'login' | 'register'

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  name: z.string().optional(),
  password: z.string().min(1, 'Informe sua senha.'),
})

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Informe seu nome.'),
  password: z.string().min(6, 'Use uma senha com pelo menos 6 caracteres.'),
})

type AuthFormValues = {
  email: string
  name?: string
  password: string
}

const authErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.',
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = String(error.code)

    return authErrorMessages[code] ?? 'Não foi possível concluir a autenticação.'
  }

  return 'Não foi possível concluir a autenticação.'
}

export const useAuthPage = () => {
  const { login, registerAccount } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState('')

  const isRegistering = mode === 'register'
  const schema = useMemo(() => (isRegistering ? registerSchema : loginSchema), [isRegistering])
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<AuthFormValues>({
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
    resolver: zodResolver(schema),
  })

  const submitAuth = handleSubmit(async ({ email, name, password }) => {
    setError('')

    try {
      if (isRegistering) {
        await registerAccount({ email, name, password })
        return
      }

      await login({ email, password })
    } catch (authError) {
      setError(getErrorMessage(authError))
    }
  })

  const switchMode = () => {
    setMode(isRegistering ? 'login' : 'register')
    setError('')
    reset({
      email: '',
      name: '',
      password: '',
    })
  }

  return {
    error,
    errors,
    isRegistering,
    isSubmitting,
    register,
    submitAuth,
    switchMode,
  }
}
