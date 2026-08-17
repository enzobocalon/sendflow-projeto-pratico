import CircularProgress from "@mui/material/CircularProgress";

import { AuthPage } from "@/features/auth";
import { useAuth } from "@/features/auth/use-auth";
import { Dashboard } from "@/features/dashboard";
import { PrivateLayout } from "@/layouts/private";

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <CircularProgress aria-label="Carregando autenticação" />
      </main>
    );
  }

  return user ? (
    <PrivateLayout user={user}>
      <Dashboard />
    </PrivateLayout>
  ) : (
    <AuthPage />
  );
}
