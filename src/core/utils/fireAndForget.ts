/**
 * Fire-and-forget API utility that survives page navigation and app closure
 * Uses sendBeacon for maximum reliability, falls back to fetch with keepalive
 */

interface FireAndForgetOptions {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Sends a fire-and-forget API request that survives page navigation
 * @param url - The API endpoint URL
 * @param data - The data to send (will be JSON stringified)
 * @param options - Additional options for the request
 */
export function fireAndForget(
  url: string, 
  data: any, 
  options: FireAndForgetOptions = {}
): void {
  try {
    const payload = JSON.stringify(data);
    const { method = 'POST', headers = {} } = options;
    
    // Use sendBeacon for maximum reliability when page is closing
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      const success = navigator.sendBeacon(url, blob);
      
      if (success) {
        console.log('Fire-and-forget request sent via sendBeacon:', url);
        return;
      }
    }
    
    // Fallback to fetch with keepalive
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Silently handle errors - this is fire-and-forget
      console.log('Fire-and-forget request failed:', url);
    });
    
  } catch (error) {
    // Silently handle errors - this is fire-and-forget
    console.log('Fire-and-forget request error:', url, error);
  }
}

/**
 * Optimistic UI update helper for like/bookmark actions
 * @param currentState - Current like/bookmark state
 * @param currentCount - Current count
 * @returns New state and count after toggle
 */
export function getOptimisticToggleState(currentState: boolean, currentCount: number) {
  const newState = !currentState;
  const newCount = newState ? currentCount + 1 : currentCount - 1;
  return { newState, newCount };
}

/**
 * Like action with optimistic UI and fire-and-forget API
 * @param ideaId - The idea ID
 * @param currentLiked - Current liked state
 * @param currentLikeCount - Current like count
 * @param onStateUpdate - Callback to update UI state
 */
export function optimisticLike(
  ideaId: string,
  currentLiked: boolean,
  currentLikeCount: number,
  onStateUpdate: (newLiked: boolean, newCount: number) => void
) {
  const { newState, newCount } = getOptimisticToggleState(currentLiked, currentLikeCount);
  
  // Update UI immediately
  onStateUpdate(newState, newCount);
  
  // Fire-and-forget API call
  fireAndForget(`/api/ideas/${ideaId}/like`, { ideaId });
}

/**
 * Bookmark action with optimistic UI and fire-and-forget API
 * @param ideaId - The idea ID
 * @param currentBookmarked - Current bookmarked state
 * @param currentBookmarkCount - Current bookmark count
 * @param onStateUpdate - Callback to update UI state
 */
export function optimisticBookmark(
  ideaId: string,
  currentBookmarked: boolean,
  currentBookmarkCount: number,
  onStateUpdate: (newBookmarked: boolean, newCount: number) => void
) {
  const { newState, newCount } = getOptimisticToggleState(currentBookmarked, currentBookmarkCount);
  
  // Update UI immediately
  onStateUpdate(newState, newCount);
  
  // Fire-and-forget API call
  fireAndForget(`/api/ideas/${ideaId}/bookmark`, { ideaId });
}
