import { CircularProgress } from '@mui/material'
import { AuthPage } from './features/auth'
import { useAuth } from './hooks/useAuth'
import { PrivateLayout } from './layouts'
import Dashboard from './features/dashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <CircularProgress aria-label="Carregando autenticação" />
      </main>
    )
  }

  return user ? (
    <PrivateLayout user={user}>
      <Dashboard />
    </PrivateLayout>
  ) : (
    <AuthPage />
  )
}

export default App
