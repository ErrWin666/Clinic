import { useEffect, useState } from "react";

/**
 * Debounce a rapidly-changing value (e.g. a search input).
 *
 * @param value  The raw, rapidly-changing value.
 * @param delay  Debounce delay in ms (default 300).
 * @returns      The debounced value that only updates after `delay` ms of quiet.
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebouncedValue(search, 300);
 * useEffect(() => { refetch(); }, [debouncedSearch]);
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
