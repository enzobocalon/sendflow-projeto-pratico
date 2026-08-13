import Typography from "@mui/material/Typography";

export function PageHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Typography component="p" className="text-sm font-medium text-blue-700">
          Área do cliente
        </Typography>
        <Typography
          component="h2"
          variant="h4"
          className="mt-1 font-semibold text-slate-950"
        >
          Gerenciamento de broadcasts
        </Typography>
        <Typography className="mt-2 max-w-2xl text-slate-600">
          Administre uma conexão por vez e avance para contatos e mensagens sem
          misturar fluxos.
        </Typography>
      </div>
    </header>
  );
}
