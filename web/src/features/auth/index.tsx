import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAuthPage } from "./useAuthPage";

export const AuthPage = () => {
  const {
    error,
    errors,
    isRegistering,
    isSubmitting,
    register,
    submitAuth,
    switchMode,
  } = useAuthPage();

  return (
    <main className="grid min-h-screen bg-slate-100 px-4 py-8 text-slate-950 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
      <section className="hidden items-center justify-center border-r border-slate-200 pr-10 lg:flex">
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">
            Sendflow Broadcast
          </p>
          <h1 className="mb-5 text-5xl font-semibold leading-tight text-slate-950">
            Gerencie suas{" "}
            <span className="italic text-blue-600">transmissões</span> com
            clareza
          </h1>
          <p className="text-lg leading-8 text-slate-600">
            Organize, agende e acompanhe cada broadcast em um painel unificado
            para toda a sua equipe.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center">
        <Paper
          elevation={0}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8"
        >
          <div className="mb-8 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              Sendflow
            </span>
          </div>

          <Typography
            component="h2"
            variant="h5"
            className="font-semibold text-slate-900"
          >
            {isRegistering ? "Criar conta" : "Entrar"}
          </Typography>
          <Typography className="mt-1.5 text-slate-500" variant="body2">
            {isRegistering
              ? "Cadastre seu acesso para começar a organizar o broadcast."
              : "Acesse sua área para continuar o gerenciamento."}
          </Typography>

          <form className="mt-6 grid gap-4" onSubmit={submitAuth}>
            {isRegistering && (
              <TextField
                label="Nome"
                autoComplete="name"
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                fullWidth
                {...register("name")}
              />
            )}

            <TextField
              label="E-mail"
              type="email"
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              required
              fullWidth
              {...register("email")}
            />

            <TextField
              label="Senha"
              type="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              required
              fullWidth
              {...register("password")}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              className="mt-1"
            >
              {isSubmitting
                ? "Aguarde..."
                : isRegistering
                  ? "Cadastrar"
                  : "Entrar"}
            </Button>
          </form>

          <Divider className="my-6" />

          <Button type="button" variant="text" fullWidth onClick={switchMode}>
            {isRegistering ? "Já tenho uma conta" : "Criar uma conta"}
          </Button>
        </Paper>
      </section>
    </main>
  );
};
