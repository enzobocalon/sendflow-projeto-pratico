import Typography from "@mui/material/Typography";

interface SectionTitleProps {
  subtitle: string;
  title: string;
}

export function SectionTitle(props: SectionTitleProps) {
  const { subtitle, title } = props;

  return (
    <div>
      <Typography
        component="h3"
        variant="h6"
        className="font-semibold text-slate-900"
      >
        {title}
      </Typography>
      <Typography className="mt-1 text-sm text-slate-500">
        {subtitle}
      </Typography>
    </div>
  );
}
