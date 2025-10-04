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

// Hook for intersection observer-based infinite loading (better performance)
export function useScrollInfiniteLoad(
  loadMore: () => void,
  hasNextPage: boolean,
  loadingMore: boolean,
  threshold = 200
) {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const lastLoadMoreTimeRef = useRef(0);

  useEffect(() => {
    // Create sentinel element for intersection observer
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    sentinel.style.position = 'absolute';
    sentinel.style.bottom = `${threshold}px`;
    sentinel.style.pointerEvents = 'none';
    sentinel.style.visibility = 'hidden';
    sentinelRef.current = sentinel;
    
    // Add sentinel to document
    document.body.appendChild(sentinel);

    // Create intersection observer with simplified logic
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isIntersecting = entry.isIntersecting;
        setIsNearBottom(isIntersecting);

        console.log('🔍 Intersection observer triggered:', {
          isIntersecting,
          hasNextPage,
          loadingMore,
          isLoadingMore: isLoadingMoreRef.current
        });

        if (isIntersecting && hasNextPage && !loadingMore && !isLoadingMoreRef.current) {
          const now = Date.now();
          const timeSinceLastLoad = now - lastLoadMoreTimeRef.current;
          const minLoadInterval = 1000; // 1 second minimum between loads

          console.log('⏰ Time check:', { timeSinceLastLoad, minLoadInterval });

          if (timeSinceLastLoad > minLoadInterval) {
            console.log('🚀 Triggering loadMore...');
            isLoadingMoreRef.current = true;
            lastLoadMoreTimeRef.current = now;
            
            // Execute loadMore immediately
            loadMore();
            isLoadingMoreRef.current = false;
          } else {
            console.log('⏳ Too soon to load more:', { timeSinceLastLoad, minLoadInterval });
          }
        } else {
          console.log('❌ Conditions not met for loadMore:', {
            isIntersecting,
            hasNextPage,
            loadingMore,
            isLoadingMore: isLoadingMoreRef.current
          });
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    // Start observing
    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (sentinelRef.current && sentinelRef.current.parentNode) {
        sentinelRef.current.parentNode.removeChild(sentinelRef.current);
      }
      isLoadingMoreRef.current = false;
    };
  }, [loadMore, hasNextPage, loadingMore, threshold]);

  return isNearBottom;
}
