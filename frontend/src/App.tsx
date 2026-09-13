import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './app/AuthProvider'
import { AuthPage } from './features/auth/AuthPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ExamplesPage } from './features/examples/ExamplesPage'
import { FrequencyPage } from './features/frequency-domain/FrequencyPage'
import { HomePage } from './features/home/HomePage'
import { TimeDomainPage } from './features/time-domain/TimeDomainPage'
import { AppLayout } from './shared/ui/AppLayout'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tiempo" element={<TimeDomainPage />} />
            <Route path="frecuencia" element={<FrequencyPage />} />
            <Route path="ejemplos" element={<ExamplesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
