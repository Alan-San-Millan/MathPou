import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import './auth.css'

type Props = {
  mode: 'login' | 'signup'
}

// Misma pantalla para login y registro; el mode solo cambia campos y el endpoint.
export function AuthPage({ mode }: Props) {
  const { user, loading, login, register } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/app" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (mode === 'signup' && password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(identifier.trim(), password)
      } else {
        await register(identifier.trim(), email, password)
      }
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page mp-enter">
      <div className="auth-shell mp-lift">
        <aside className="auth-brand" aria-hidden="true">
          <p className="mp-eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <i className="uil uil-university" /> Laboratorio de señales
          </p>
          <h1>MathPou</h1>
          <p>Simulador de series de Fourier para estudiantes de ingeniería.</p>
        </aside>
        <div className="auth-panel">
          {mode === 'login' ? (
            <>
              <h2>
                <i className="uil uil-signin" aria-hidden="true" /> Bienvenido de nuevo
              </h2>
              <p className="mp-lede">Entra con tu usuario o correo para continuar.</p>
            </>
          ) : (
            <>
              <h2>
                <i className="uil uil-user-plus" aria-hidden="true" /> Crear cuenta
              </h2>
              <p className="mp-lede">Regístrate para guardar tu acceso al laboratorio.</p>
            </>
          )}
          <form onSubmit={onSubmit}>
            <div>
              <label htmlFor="auth-identifier">
                <i className="uil uil-user" aria-hidden="true" />{' '}
                {mode === 'login' ? 'Usuario o correo' : 'Nombre de usuario'}
              </label>
              <input
                id="auth-identifier"
                name="username"
                type="text"
                autoComplete="username"
                inputMode={mode === 'login' ? 'email' : 'text'}
                placeholder={mode === 'login' ? 'ana o ana@correo.com' : undefined}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-email">
                  <i className="uil uil-envelope" aria-hidden="true" /> Email
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-password">
                <i className="uil uil-lock" aria-hidden="true" /> Contraseña
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-password2">
                  <i className="uil uil-lock-access" aria-hidden="true" /> Confirmar contraseña
                </label>
                <input
                  id="auth-password2"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                />
              </div>
            )}
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className={`mp-btn mp-btn-accent mp-press${submitting ? ' mp-busy' : ''}`}
              disabled={submitting}
            >
              {submitting ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          </form>
          <div className="auth-footer">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta? <Link to="/signup">Regístrate</Link>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
