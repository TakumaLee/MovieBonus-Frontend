// @ts-nocheck
/**
 * useSearch Hook
 * 
 * Manages movie search functionality with suggestions and history
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { movieApi, api } from '@/lib/api-endpoints';
import { handleApiError } from '@/lib/api-client';
import type { Movie, SearchState, LoadingState } from '@/lib/types';
import config from '@/lib/config';

export interface UseSearchOptions {
  enableSuggestions?: boolean;
  enableHistory?: boolean;
  debounceDelay?: number;
  maxSuggestions?: number;
  maxHistory?: number;
}

export interface UseSearchReturn extends LoadingState {
  query: string;
  results: Movie[];
  suggestions: string[];
  history: string[];
  isSearching: boolean;
  hasSuggestions: boolean;
  hasResults: boolean;
  search: (query: string) => Promise<void>;
  setQuery: (query: string) => void;
  clearResults: () => void;
  clearHistory: () => void;
  getSuggestions: (query: string) => Promise<void>;
}

// Local storage keys
const SEARCH_HISTORY_KEY = 'moviebonus_search_history';
const RECENT_QUERIES_KEY = 'moviebonus_recent_queries';

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    enableSuggestions = true,
    enableHistory = true,
    debounceDelay = config.ui.debounceDelay,
    maxSuggestions = config.ui.maxSearchSuggestions,
    maxHistory = config.ui.maxSearchHistory,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date>();

  // Debounced query for suggestions
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Load search history from localStorage
  useEffect(() => {
    if (enableHistory && typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, [enableHistory]);

  // Save search history to localStorage
  const saveHistory = useCallback((newHistory: string[]) => {
    if (enableHistory && typeof window !== 'undefined') {
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
    }
  }, [enableHistory]);

  // Add query to history
  const addToHistory = useCallback((searchQuery: string) => {
    if (!enableHistory || !searchQuery.trim()) return;

    setHistory(prevHistory => {
      const filteredHistory = prevHistory.filter(item => item !== searchQuery);
      const newHistory = [searchQuery, ...filteredHistory].slice(0, maxHistory);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [enableHistory, maxHistory, saveHistory]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    }
  }, []);

  // Get search suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (!enableSuggestions || !searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await api.search.suggest(searchQuery, maxSuggestions);
      if (response.success && response.data) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.warn('Failed to get search suggestions:', err);
      setSuggestions([]);
    }
  }, [enableSuggestions, maxSuggestions]);

  // Perform movie search
  const search = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      setResults([]);
      setError(undefined);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    setError(undefined);

    try {
      const searchResults = await movieApi.searchMovies(trimmedQuery);
      setResults(searchResults);
      addToHistory(trimmedQuery);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setResults([]);
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, [addToHistory]);

  // Clear search results
  const clearResults = useCallback(() => {
    setResults([]);
    setError(undefined);
    setIsSearching(false);
    setSuggestions([]);
  }, []);

  // Auto-suggest when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== query) {
      getSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, query, getSuggestions]);

  // Computed properties
  const hasSuggestions = suggestions.length > 0;
  const hasResults = results.length > 0;

  return {
    query,
    results,
    suggestions,
    history,
    isSearching,
    isLoading,
    error,
    lastUpdated,
    hasSuggestions,
    hasResults,
    search,
    setQuery,
    clearResults,
    clearHistory,
    getSuggestions,
  };
}

// Specialized hook for search with auto-search on query change
export function useAutoSearch(initialQuery = '', searchDelay = 500) {
  const searchHook = useSearch({ debounceDelay: searchDelay });
  const debouncedQuery = useDebounce(searchHook.query, searchDelay);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery !== searchHook.query) {
      searchHook.search(debouncedQuery);
    }
  }, [debouncedQuery, searchHook]);

  // Set initial query
  useEffect(() => {
    if (initialQuery) {
      searchHook.setQuery(initialQuery);
    }
  }, [initialQuery, searchHook]);

  return searchHook;
}

// Hook for search suggestions only (lighter weight)
export function useSearchSuggestions(query: string, enabled = true) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!enabled || !debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await api.search.suggest(debouncedQuery, 5);
        if (response.success && response.data) {
          setSuggestions(response.data);
        }
      } catch (error) {
        console.warn('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, enabled]);

  return { suggestions, isLoading };
}