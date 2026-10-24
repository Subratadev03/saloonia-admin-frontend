import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import { Role, type AuthUser } from '../types'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'

function destination(user: AuthUser) {
  if (user.role === Role.SUPER_ADMIN) return '/platform'
  if (user.role === Role.SALON_ADMIN || user.role === Role.STAFF) return '/admin'
  return '/app'
}

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', {
        email: form.get('email'),
        password: form.get('password'),
      })
      setAuth(data.accessToken, data.user)
      navigate(destination(data.user))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap grid min-h-[74vh] place-items-center py-12">
      <Card className="w-full max-w-md p-8">
        <p className="eyebrow">Welcome back</p>
        <h1 className="font-serif mt-4 text-4xl">Sign in</h1>
        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
          <Field label="Email">
            <Input name="email" type="email" required placeholder="you@email.com" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required minLength={8} />
          </Field>
          {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
          <Button type="submit" className="mt-1 w-full" loading={loading} icon={<ArrowRight className="relative h-4 w-4" />}>
            {loading ? 'Checking…' : 'Continue'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-rose-deep underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <div className="mt-6 rounded-2xl border border-line/80 bg-ivory/80 p-4 text-xs leading-relaxed text-muted">
          Demo password for every seeded user: <strong className="text-ink">Salon@123</strong>
          <br />
          oscar.d@example.net · emma.t@example.net · customer@saloonia.com
        </div>
      </Card>
    </div>
  )
}
