// @ts-nocheck
import type { DeveloperCandidate } from './rotation-helpers';

/**
 * Enhanced cache manager with warming and multi-level caching
 */
export class RotationCacheEnhanced {
  private static cache = new Map<string, { result: DeveloperCandidate[], timestamp: number }>();
  private static readonly CACHE_TTL_MS = 30000; // 30 seconds
  private static readonly WARMUP_CACHE_TTL_MS = 300000; // 5 minutes for warmup data
  
  /**
   * Get cached result if valid
   */
  static get(cacheKey: string): DeveloperCandidate[] | null {
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return cached.result;
    }
    return null;
  }
  
  /**
   * Set cache entry
   */
  static set(cacheKey: string, result: DeveloperCandidate[], isWarmup: boolean = false): void {
    const ttl = isWarmup ? this.WARMUP_CACHE_TTL_MS : this.CACHE_TTL_MS;
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now() - (this.CACHE_TTL_MS - ttl) // Adjust timestamp for longer TTL
    });
    console.log(`Cache set for key: ${cacheKey} (${isWarmup ? 'warmup' : 'normal'})`);
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
      console.log(`Cleared cache for project: ${projectId}`);
    } else {
      // Clear all cache
      this.cache.clear();
      console.log('Cleared all cache');
    }
  }
  
  /**
   * Generate cache key
   */
  static generateKey(projectId: string, skillsRequired: string[], selection: any): string {
    return `${projectId}-${skillsRequired.sort().join(',')}-${JSON.stringify(selection)}`;
  }
  
  /**
   * Warmup cache for common queries
   */
  static async warmupCache(projectId: string, skillsRequired: string[]): Promise<void> {
    console.time('warmupCache');
    
    try {
      // Import here to avoid circular dependencies
      const { RotationDbOptimized } = await import('./rotation-db-optimized');
      
      // Pre-fetch available skills
      const availableSkills = await RotationDbOptimized.getAvailableSkillsOptimized(skillsRequired);
      
      // Pre-fetch blocked developers
      const blockedDevelopers = await RotationDbOptimized.getBlockedDevelopersOptimized(projectId);
      
      // Create warmup cache entries for common selections
      const commonSelections = [
        { fresherCount: 5, midCount: 5, expertCount: 3 },
        { fresherCount: 3, midCount: 3, expertCount: 2 },
        { fresherCount: 7, midCount: 7, expertCount: 4 }
      ];
      
      for (const selection of commonSelections) {
        const cacheKey = this.generateKey(projectId, availableSkills, selection);
        
        // Check if we already have this in cache
        if (!this.get(cacheKey)) {
          // Pre-fetch candidates for this selection
          try {
            const candidates = await RotationDbOptimized.getCandidatesOptimized(
              availableSkills,
              'warmup', // Dummy client ID for warmup
              projectId,
              selection,
              blockedDevelopers
            );
            
            // Store in cache with warmup flag
            this.set(cacheKey, candidates, true);
          } catch (error) {
            console.warn(`Failed to warmup cache for selection ${JSON.stringify(selection)}:`, error);
          }
        }
      }
      
      console.timeEnd('warmupCache');
      console.log(`Cache warmup completed for project ${projectId}`);
      
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  static getStats(): { size: number, keys: string[], hitRate?: number } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
  
  /**
   * Cleanup expired cache entries
   */
  static cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache) {
      if ((now - value.timestamp) > this.CACHE_TTL_MS) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  }
}
