import { useEffect, useRef, type ReactNode } from "react";
import { PageNavigation } from "./PageNavigation";
import { PaginationTransition } from "./PaginationTransition";

type PaginatedContentProps = {
  children: ReactNode;
  contentLabel: string;
  currentPage: number;
  disabled?: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  loadingLabel: string;
  onNextPage: () => void;
  onPreviousPage: () => void;
  size?: "small" | "medium";
};

export function PaginatedContent({
  children,
  contentLabel,
  currentPage,
  disabled = false,
  hasNextPage,
  hasPreviousPage,
  isLoading,
  loadingLabel,
  onNextPage,
  onPreviousPage,
  size = "medium",
}: PaginatedContentProps) {
  const topNavigationRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(currentPage);
  const showNavigation = hasPreviousPage || hasNextPage || isLoading;

  useEffect(() => {
    if (isLoading || previousPageRef.current === currentPage) return;

    previousPageRef.current = currentPage;
    const topNavigation = topNavigationRef.current;

    if (!topNavigation) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    topNavigation.focus({ preventScroll: true });
    topNavigation.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [currentPage, isLoading]);

  const navigationProps = {
    currentPage,
    disabled,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    loadingLabel,
    onNextPage,
    onPreviousPage,
    size,
  };

  return (
    <div className="grid gap-3">
      <div
        aria-label={`${contentLabel}, página ${currentPage}`}
        className="scroll-mt-4 focus:outline-none"
        ref={topNavigationRef}
        role="region"
        tabIndex={-1}
      >
        {showNavigation && (
          <PageNavigation
            {...navigationProps}
            announceChanges
            ariaLabel={`Paginação superior de ${contentLabel}`}
            placement="top"
          />
        )}
      </div>

      <PaginationTransition
        isLoading={isLoading}
        loadingLabel={loadingLabel}
      >
        {children}
      </PaginationTransition>

      {showNavigation && (
        <PageNavigation
          {...navigationProps}
          ariaLabel={`Paginação inferior de ${contentLabel}`}
          placement="bottom"
        />
      )}
    </div>
  );
}
