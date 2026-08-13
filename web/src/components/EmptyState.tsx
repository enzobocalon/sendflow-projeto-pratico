import Typography from "@mui/material/Typography";

interface EmptyStateProps {
  description: string;
  title: string;
}

export function EmptyState(props: EmptyStateProps) {
  const { description, title } = props;

  return (
    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
      <Typography className="font-medium text-slate-800">{title}</Typography>
      <Typography className="mt-1 text-sm text-slate-500">
        {description}
      </Typography>
    </div>
  );
}
