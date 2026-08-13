import LinearProgress from "@mui/material/LinearProgress";
import type { ReactNode } from "react";
import { useDelayedFlag } from "../hooks/use-delayed-flag";

interface PaginationTransitionProps {
  children: ReactNode;
  isLoading: boolean;
  loadingLabel: string;
}

export function PaginationTransition(props: PaginationTransitionProps) {
  const { children, isLoading, loadingLabel } = props;

  const showLoadingIndicator = useDelayedFlag(isLoading);

  return (
    <div aria-busy={isLoading} className="relative">
      {showLoadingIndicator && (
        <LinearProgress
          aria-label={loadingLabel}
          className="absolute inset-x-0 top-0 z-10"
        />
      )}
      <div
        className={`transition-opacity duration-150 ${
          showLoadingIndicator ? "opacity-60" : "opacity-100"
        } ${isLoading ? "pointer-events-none" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
