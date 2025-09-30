/**
 * Image Optimization Service
 * Tối ưu hóa xử lý images với thumbnails và lazy loading
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  blur?: boolean;
}

interface OptimizedImage {
  url: string;
  urlSmall: string;
  urlMedium?: string;
  urlLarge?: string;
  width: number;
  height: number;
  bytes: number;
  blurHash?: string;
  alt?: string;
}

class ImageOptimizationService {
  private baseUrl: string;
  private cdnUrl?: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.cdnUrl = process.env.CDN_URL;
  }

  /**
   * Generate thumbnail URL
   */
  generateThumbnailUrl(originalUrl: string, options: ImageOptimizationOptions = {}): string {
    if (!originalUrl) return '';
    
    const {
      width = 400,
      height = 300,
      quality = 80,
      format = 'webp'
    } = options;

    // Nếu có CDN, sử dụng CDN với parameters
    if (this.cdnUrl) {
      const params = new URLSearchParams({
        w: width.toString(),
        h: height.toString(),
        q: quality.toString(),
        f: format
      });
      return `${this.cdnUrl}/${originalUrl}?${params.toString()}`;
    }

    // Fallback: sử dụng Next.js Image Optimization
    const params = new URLSearchParams({
      url: originalUrl,
      w: width.toString(),
      h: height.toString(),
      q: quality.toString(),
      f: format
    });
    
    return `${this.baseUrl}/_next/image?${params.toString()}`;
  }

  /**
   * Generate multiple image sizes
   */
  generateImageSizes(originalUrl: string): OptimizedImage {
    if (!originalUrl) {
      return {
        url: '',
        urlSmall: '',
        width: 0,
        height: 0,
        bytes: 0
      };
    }

    return {
      url: originalUrl,
      urlSmall: this.generateThumbnailUrl(originalUrl, { width: 400, height: 300 }),
      urlMedium: this.generateThumbnailUrl(originalUrl, { width: 800, height: 600 }),
      urlLarge: this.generateThumbnailUrl(originalUrl, { width: 1200, height: 900 }),
      width: 1920, // Default width
      height: 1080, // Default height
      bytes: 0, // Will be calculated
      blurHash: this.generateBlurHash(originalUrl)
    };
  }

  /**
   * Generate blur hash for placeholder
   */
  private generateBlurHash(url: string): string {
    // Simple blur hash generation
    // In production, you might want to use a proper blur hash library
    const hash = this.simpleHash(url);
    return `LEHV6nWB2yk8pyo0adR*.7kCMdnj${hash}`;
  }

  /**
   * Simple hash function for blur hash
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 4);
  }

  /**
   * Optimize gallery images for listing
   */
  optimizeGalleryForListing(galleryImages: string[]): OptimizedImage[] {
    return galleryImages.map(url => this.generateImageSizes(url));
  }

  /**
   * Optimize single image for detail view
   */
  optimizeImageForDetail(originalUrl: string): OptimizedImage {
    return this.generateImageSizes(originalUrl);
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(originalUrl: string): string {
    const sizes = [
      { width: 400, height: 300 },
      { width: 800, height: 600 },
      { width: 1200, height: 900 },
      { width: 1600, height: 1200 }
    ];

    return sizes
      .map(size => {
        const url = this.generateThumbnailUrl(originalUrl, size);
        return `${url} ${size.width}w`;
      })
      .join(', ');
  }

  /**
   * Check if image needs optimization
   */
  needsOptimization(url: string): boolean {
    if (!url) return false;
    
    // Check if it's already optimized
    if (url.includes('_next/image') || url.includes('cdn')) {
      return false;
    }
    
    // Check file size (if available)
    // This would need to be implemented with actual file size checking
    return true;
  }

  /**
   * Lazy load image with intersection observer
   */
  createLazyLoadObserver(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });
  }

  /**
   * Preload critical images
   */
  preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  /**
   * Batch preload images
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.preloadImage(url));
    await Promise.allSettled(promises);
  }

  /**
   * Generate image metadata for SEO
   */
  generateImageMetadata(image: OptimizedImage): any {
    return {
      url: image.url,
      width: image.width,
      height: image.height,
      alt: image.alt || '',
      type: 'image/webp',
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    };
  }
}

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();
export default imageOptimizationService;
