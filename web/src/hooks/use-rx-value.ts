import { useEffect, useState, type DependencyList } from "react";
import type { Observable } from "rxjs";

export function useRxValue<T>(
  observable: () => Observable<T>,
  dependencies: DependencyList,
  initialValue: T,
  refresh = true,
): readonly [T, boolean] {
  const canSubscribe = dependencies.every(
    (dependency) => dependency !== null && dependency !== undefined,
  );

  const [state, setState] = useState<readonly [T, boolean]>([
    initialValue,
    true,
  ]);

  useEffect(() => {
    if (!canSubscribe) return;

    let isActive = true;
    const subscription = observable().subscribe({
      error: () => {
        if (!isActive) return;

        setState(([currentValue]) => [currentValue, false]);
      },
      next: (value) => {
        if (!isActive) return;

        setState([value, false]);
      },
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
      setState(([currentValue]) => [
        refresh ? initialValue : currentValue,
        true,
      ]);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return canSubscribe ? state : [initialValue, false];
}
