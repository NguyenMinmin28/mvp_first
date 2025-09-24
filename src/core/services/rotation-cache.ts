// @ts-nocheck
import type { DeveloperCandidate } from './rotation-helpers';

/**
 * Simple in-memory cache for rotation results (5 second TTL)
 */
export class RotationCache {
  private static cache = new Map<string, { result: DeveloperCandidate[], timestamp: number }>();
  private static readonly CACHE_TTL_MS = 5000;
  
  /**
   * Get cached result if valid
   */
  static get(cacheKey: string): DeveloperCandidate[] | null {
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      return cached.result;
    }
    return null;
  }
  
  /**
   * Set cache entry
   */
  static set(cacheKey: string, result: DeveloperCandidate[]): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear rotation cache for a specific project or all cache
   */
  static clear(projectId?: string): void {
    if (projectId) {
      // Clear cache entries for specific project
      for (const [key] of this.cache) {
        if (key.startsWith(`${projectId}-`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
  
  /**
   * Generate cache key
   */
  static generateKey(projectId: string, skillsRequired: string[], selection: any): string {
    return `${projectId}-${skillsRequired.sort().join(',')}-${JSON.stringify(selection)}`;
  }
}
