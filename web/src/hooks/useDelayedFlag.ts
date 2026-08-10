import { useEffect, useState } from "react";

export function useDelayedFlag(value: boolean, delay = 150) {
  const [delayedValue, setDelayedValue] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDelayedValue(value);
    }, value ? delay : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return value && delayedValue;
}
