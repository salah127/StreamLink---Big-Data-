import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StreamPlatform } from '../types/api';

export type PlatformFilter = 'ALL' | StreamPlatform;
export type CategoryFilter = 'ALL' | string;

export interface TrendingFilters {
  platform: PlatformFilter;
  category: CategoryFilter;
}

const STORAGE_KEY = 'streamlink:trendingFilters';
const DEFAULT_FILTERS: TrendingFilters = {
  platform: 'ALL',
  category: 'ALL',
};

const isValidPlatform = (value: unknown): value is PlatformFilter => {
  return value === 'ALL' || typeof value === 'string';
};

const isValidCategory = (value: unknown): value is CategoryFilter => {
  return value === 'ALL' || (typeof value === 'string' && value.trim().length > 0);
};

const normalizeFilters = (value: unknown): TrendingFilters | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const platform = (value as Record<string, unknown>).platform;
  const category = (value as Record<string, unknown>).category;

  if (!isValidPlatform(platform) || !isValidCategory(category)) {
    return null;
  }

  return {
    platform,
    category,
  };
};

export const useTrendingFilters = (initialFilters: TrendingFilters = DEFAULT_FILTERS) => {
  const [filters, setFilters] = useState<TrendingFilters>(initialFilters);
  const [hydrated, setHydrated] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          return;
        }

        const parsed = normalizeFilters(JSON.parse(stored));
        if (parsed && isMountedRef.current) {
          setFilters(parsed);
        }
      } catch (error) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[useTrendingFilters] Failed to read filters', error);
        }
      } finally {
        if (isMountedRef.current) {
          setHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const persist = useCallback(async (value: TrendingFilters) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[useTrendingFilters] Failed to persist filters', error);
      }
    }
  }, []);

  const updateFilters = useCallback((partial: Partial<TrendingFilters>) => {
    setFilters((current) => {
      const next = { ...current, ...partial };
      void persist(next);
      return next;
    });
  }, [persist]);

  const resetFilters = useCallback(() => {
    setFilters(() => {
      void persist(initialFilters);
      return initialFilters;
    });
  }, [initialFilters, persist]);

  return {
    filters,
    hydrated,
    updateFilters,
    resetFilters,
  } as const;
};
