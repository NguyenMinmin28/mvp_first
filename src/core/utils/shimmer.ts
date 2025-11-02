/**
 * Shimmer utility functions for creating Uber-like skeleton loading effects
 * Generates SVG-based shimmer placeholders for images
 */

/**
 * Generates an SVG shimmer effect that can be used as a blur placeholder
 * @param w - Width of the shimmer placeholder
 * @param h - Height of the shimmer placeholder
 * @returns SVG string with animated shimmer gradient
 */
export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shimmer-base" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#eee" stop-opacity="1" />
      <stop offset="20%" stop-color="#f5f5f5" stop-opacity="1" />
      <stop offset="50%" stop-color="#eee" stop-opacity="1" />
      <stop offset="80%" stop-color="#f5f5f5" stop-opacity="1" />
      <stop offset="100%" stop-color="#eee" stop-opacity="1" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#shimmer-base)"/>
</svg>`;

/**
 * Converts a string to base64 encoding
 * Works in both browser and Node.js environments
 * @param str - String to encode
 * @returns Base64 encoded string
 */
export const toBase64 = (str: string): string => {
  if (typeof window === "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return window.btoa(str);
};

/**
 * Generates a blur data URL for Next.js Image placeholder
 * @param w - Width of the placeholder
 * @param h - Height of the placeholder
 * @returns Data URL string ready for blurDataURL prop
 */
export const shimmerDataURL = (w: number, h: number): string => {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
};

/**
 * Common shimmer dimensions for different use cases
 */
export const SHIMMER_SIZES = {
  thumbnail: { w: 200, h: 200 },
  card: { w: 400, h: 300 },
  hero: { w: 1200, h: 800 },
  square: { w: 400, h: 400 },
  portrait: { w: 400, h: 600 },
  landscape: { w: 800, h: 400 },
} as const;

