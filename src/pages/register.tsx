import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'

export function RegisterPage() {
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
      const { data } = await api.post('/auth/register', {
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        email: form.get('email'),
        phone: form.get('phone'),
        password: form.get('password'),
      })
      setAuth(data.accessToken, data.user)
      navigate('/salons')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap grid min-h-[74vh] place-items-center py-12">
      <Card className="w-full max-w-md p-8">
        <p className="eyebrow">Guest account</p>
        <h1 className="font-serif mt-4 text-4xl">Join Saloonia</h1>
        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input name="firstName" required />
            </Field>
            <Field label="Last name">
              <Input name="lastName" required />
            </Field>
          </div>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Phone">
            <Input name="phone" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required minLength={8} />
          </Field>
          {error ? <p className="text-sm text-rose-deep">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading} icon={<Sparkles className="relative h-4 w-4" />}>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-rose-deep underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
