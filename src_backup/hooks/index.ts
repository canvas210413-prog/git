"use client";

import { useState, useCallback, useEffect, useTransition, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// ============================================
// CRM AI Platform - Custom Hooks
// ============================================

/**
 * Debounced value hook
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Local storage hook with SSR support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error("useLocalStorage error:", error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Toggle hook
 */
export function useToggle(initialValue: boolean = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}

/**
 * Pagination hook with URL sync
 */
export function usePagination(defaultLimit: number = 10) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || defaultLimit;

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", newLimit.toString());
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return { page, limit, setPage, setLimit };
}

/**
 * Search with URL sync hook
 */
export function useSearch(paramName: string = "q") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get(paramName) || "";
  const [inputValue, setInputValue] = useState(query);
  const debouncedValue = useDebounce(inputValue, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set(paramName, debouncedValue);
      params.set("page", "1");
    } else {
      params.delete(paramName);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedValue, router, pathname, searchParams, paramName]);

  return { query: inputValue, setQuery: setInputValue };
}

/**
 * Async action hook with loading and error states
 */
export function useAsyncAction<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      setError(null);
      try {
        startTransition(async () => {
          const result = await action(...args);
          setData(result);
        });
      } catch (e) {
        setError(e as Error);
        throw e;
      }
    },
    [action]
  );

  return { execute, isPending, error, data };
}

/**
 * Dialog/Modal state hook
 */
export function useDialog<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((initialData?: T) => {
    setData(initialData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return { isOpen, data, open, close };
}

/**
 * Filter state hook
 */
export function useFilters<T extends Record<string, unknown>>(
  initialFilters: T
) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== null && v !== ""
  );

  return { filters, setFilter, setFilters, clearFilters, hasActiveFilters };
}

/**
 * Selection hook for tables
 */
export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [items, selectedIds.size]);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds,
    selectedItems,
    isSelected,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    isPartiallySelected,
    count: selectedIds.size,
  };
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Interval hook
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

/**
 * Mobile detection hook
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}
