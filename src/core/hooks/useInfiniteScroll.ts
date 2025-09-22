import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number, limit: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;
  limit?: number;
  enabled?: boolean;
  resetDependencies?: any[];
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  hasNextPage: boolean;
  error: string | null;
  loadMore: () => void;
  reset: () => void;
  totalCount: number;
}

export function useInfiniteScroll<T>({
  fetchData,
  limit = 12,
  enabled = true,
  resetDependencies = []
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Reset data when dependencies change
  useEffect(() => {
    if (enabled) {
      reset();
    }
  }, [...resetDependencies, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setError(null);
    setTotalCount(0);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const loadData = useCallback(async (page: number, isLoadMore = false) => {
    if (!enabled || (!hasNextPage && isLoadMore)) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const result = await fetchData(page, limit);
      
      if (!mountedRef.current) return;

      if (isLoadMore) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data);
      }
      
      setCurrentPage(result.pagination.page);
      setHasNextPage(result.pagination.hasNextPage);
      setTotalCount(result.pagination.totalCount);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      if ((err as any)?.name !== 'AbortError') {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [enabled, hasNextPage, fetchData, limit]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      loadData(currentPage + 1, true);
    }
  }, [loadingMore, hasNextPage, currentPage, loadData]);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0 && !loading) {
      loadData(1, false);
    }
  }, [enabled, data.length, loading, loadData]);

  return {
    data,
    loading,
    loadingMore,
    hasNextPage,
    error,
    loadMore,
    reset,
    totalCount
  };
}

// Hook for scroll-based infinite loading
export function useScrollInfiniteLoad(
  loadMore: () => void,
  hasNextPage: boolean,
  loadingMore: boolean,
  threshold = 200
) {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const lastScrollTimeRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      lastScrollTimeRef.current = now;

      // Debounce scroll events to prevent excessive calculations
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        // Only process if this is still the latest scroll event
        if (lastScrollTimeRef.current !== now) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Add safety check for valid document height
        if (documentHeight <= windowHeight) return;

        const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
        const nearBottom = distanceFromBottom < threshold;

        setIsNearBottom(nearBottom);

        if (nearBottom && hasNextPage && !loadingMore) {
          loadMore();
        }
      }, 100); // 100ms debounce
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen for resize events that might affect layout
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [loadMore, hasNextPage, loadingMore, threshold]);

  return isNearBottom;
}
