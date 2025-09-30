/**
 * Lightweight in-memory cache (no external dependencies)
 * Same API surface as the previous Redis cache so callers need no change.
 * Note: This cache resets on process restart and is per-instance only.
 */

type CacheEntry = {
  value: any;
  expiresAt: number; // epoch ms
};

class CacheService {
  private store: Map<string, CacheEntry> = new Map();

  // No-op to keep previous lifecycle compatible
  constructor() {}

  /**
   * Generate cache key cho services API
   */
  private generateServicesKey(params: any): string {
    const {
      limit,
      sort,
      search,
      categories,
      skills,
      priceMin,
      priceMax,
      myServices,
      cursor
    } = params;

    const keyParts = [
      'services',
      `limit:${limit}`,
      `sort:${sort}`,
      search ? `search:${search}` : '',
      categories?.length ? `categories:${categories.sort().join(',')}` : '',
      skills?.length ? `skills:${skills.sort().join(',')}` : '',
      priceMin ? `priceMin:${priceMin}` : '',
      priceMax ? `priceMax:${priceMax}` : '',
      myServices ? 'myServices:true' : '',
      cursor ? `cursor:${cursor}` : ''
    ].filter(Boolean);

    return keyParts.join('|');
  }

  /**
   * Generate cache key cho developers API
   */
  private generateDevelopersKey(params: any): string {
    const {
      limit,
      sort,
      search,
      cursor
    } = params;

    const keyParts = [
      'developers',
      `limit:${limit}`,
      `sort:${sort}`,
      search ? `search:${search}` : '',
      cursor ? `cursor:${cursor}` : ''
    ].filter(Boolean);

    return keyParts.join('|');
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Set cached data với TTL
   */
  async set(key: string, data: any, ttlSeconds: number = 300): Promise<boolean> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value: data, expiresAt });
    return true;
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<boolean> {
    // Very small pattern support: treat pattern as a substring matcher
    const toDelete: string[] = [];
    const needle = pattern.replace('*', '');
    for (const key of this.store.keys()) {
      if (pattern === '*' || key.includes(needle)) toDelete.push(key);
    }
    toDelete.forEach((k) => this.store.delete(k));
    return true;
  }

  /**
   * Cache services API response
   */
  async cacheServicesResponse(params: any, data: any): Promise<boolean> {
    const key = this.generateServicesKey(params);
    const ttl = params.search ? 60 : 300; // Shorter TTL for search results
    return this.set(key, data, ttl);
  }

  /**
   * Get cached services API response
   */
  async getCachedServicesResponse(params: any): Promise<any> {
    const key = this.generateServicesKey(params);
    return this.get(key);
  }

  /**
   * Cache developers API response
   */
  async cacheDevelopersResponse(params: any, data: any): Promise<boolean> {
    const key = this.generateDevelopersKey(params);
    const ttl = params.search ? 60 : 300; // Shorter TTL for search results
    return this.set(key, data, ttl);
  }

  /**
   * Get cached developers API response
   */
  async getCachedDevelopersResponse(params: any): Promise<any> {
    const key = this.generateDevelopersKey(params);
    return this.get(key);
  }

  /**
   * Invalidate cache khi có thay đổi dữ liệu
   */
  async invalidateServicesCache(): Promise<void> {
    await this.deletePattern('services|');
    console.log('🔄 Services cache invalidated');
  }

  async invalidateDevelopersCache(): Promise<void> {
    await this.deletePattern('developers|');
    console.log('🔄 Developers cache invalidated');
  }

  /**
   * Invalidate cache cho specific developer
   */
  async invalidateDeveloperCache(developerId: string): Promise<void> {
    await this.deletePattern(`developers|developer:${developerId}`);
    console.log(`🔄 Developer ${developerId} cache invalidated`);
  }

  /**
   * Invalidate cache cho specific service
   */
  async invalidateServiceCache(serviceId: string): Promise<void> {
    await this.deletePattern(`services|service:${serviceId}`);
    console.log(`🔄 Service ${serviceId} cache invalidated`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    return { connected: true, size: this.store.size };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
