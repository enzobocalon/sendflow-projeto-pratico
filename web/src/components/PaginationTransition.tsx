import { LinearProgress } from "@mui/material";
import type { ReactNode } from "react";
import { useDelayedFlag } from "../hooks/useDelayedFlag";

type PaginationTransitionProps = {
  children: ReactNode;
  isLoading: boolean;
  loadingLabel: string;
};

export function PaginationTransition({
  children,
  isLoading,
  loadingLabel,
}: PaginationTransitionProps) {
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
