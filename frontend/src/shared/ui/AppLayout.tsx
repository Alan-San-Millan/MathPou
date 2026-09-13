import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import { AppSidebar } from './AppSidebar'

export function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) return <p style={{ padding: '2rem' }}>Cargando…</p>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="app-layout">
      <AppSidebar />
      <div className="app-main">
        <Outlet />
      </div>
    </div>
  )
}
