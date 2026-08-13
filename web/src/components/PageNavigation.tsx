import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useDelayedFlag } from "../hooks/useDelayedFlag";

type PageNavigationProps = {
  announceChanges?: boolean;
  ariaLabel: string;
  currentPage: number;
  disabled?: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading?: boolean;
  loadingLabel: string;
  onNextPage: () => void;
  onPreviousPage: () => void;
  placement: "bottom" | "top";
  size?: "small" | "medium";
};

export function PageNavigation({
  announceChanges = false,
  ariaLabel,
  currentPage,
  disabled = false,
  hasNextPage,
  hasPreviousPage,
  isLoading = false,
  loadingLabel,
  onNextPage,
  onPreviousPage,
  placement,
  size = "medium",
}: PageNavigationProps) {
  const showLoadingIndicator = useDelayedFlag(isLoading);

  return (
    <Stack
      alignItems="center"
      aria-label={ariaLabel}
      className={placement === "top" ? "pb-2" : "pt-2"}
      component="nav"
      direction="row"
      justifyContent="center"
      spacing={2}
    >
      <Button
        aria-label="Ir para a página anterior"
        disabled={disabled || isLoading || !hasPreviousPage}
        onClick={onPreviousPage}
        size={size}
        type="button"
        variant="outlined"
      >
        Anterior
      </Button>
      <Stack
        alignItems="center"
        aria-live={announceChanges ? "polite" : undefined}
        className="min-w-32"
        direction="row"
        justifyContent="center"
        spacing={1}
      >
        <Typography className="text-center text-sm">
          Página {currentPage}
        </Typography>
        {showLoadingIndicator && <CircularProgress aria-hidden size={14} />}
        {announceChanges && isLoading && (
          <span className="sr-only">{loadingLabel}</span>
        )}
      </Stack>
      <Button
        aria-label="Ir para a próxima página"
        disabled={disabled || isLoading || !hasNextPage}
        onClick={onNextPage}
        size={size}
        type="button"
        variant="outlined"
      >
        Próxima
      </Button>
    </Stack>
  );
}
