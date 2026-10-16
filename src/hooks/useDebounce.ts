import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a fast-changing value (such as search input keystrokes).
 * Delays updating the debounced value until after the specified delay has passed
 * since the last time the input value changed.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
