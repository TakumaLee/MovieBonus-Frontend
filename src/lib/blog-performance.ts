// @ts-nocheck
/**
 * Blog Performance Utilities
 * 
 * Performance optimization utilities for the blog system including
 * image optimization, lazy loading, and caching strategies
 */

// Image optimization utilities
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Generate optimized image props for Next.js Image component
 */
export function generateOptimizedImageProps(
  src: string,
  alt: string,
  options: Partial<OptimizedImageProps> = {}
): OptimizedImageProps {
  return {
    src,
    alt,
    width: options.width || 800,
    height: options.height || 600,
    quality: options.quality || 85,
    priority: options.priority || false,
    placeholder: options.placeholder || 'blur',
    blurDataURL: options.blurDataURL || generateBlurPlaceholder(400, 300),
    ...options
  };
}

/**
 * Generate a blur placeholder for images
 */
export function generateBlurPlaceholder(width: number, height: number): string {
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#blur)" />
    </svg>`
  ).toString('base64')}`;
}

// Lazy loading utilities
export interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Create intersection observer for lazy loading
 */
export function createLazyLoader(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: LazyLoadOptions = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: options.threshold || 0.1,
    rootMargin: options.rootMargin || '50px',
  };

  return new IntersectionObserver((entries) => {
    callback(entries);
    
    if (options.triggerOnce) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
        }
      });
    }
  }, defaultOptions);
}

// Caching utilities
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string;
  storage?: 'memory' | 'sessionStorage' | 'localStorage';
}

class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttl: number): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const memoryCache = new MemoryCache();

/**
 * Cache data with configurable storage and TTL
 */
export function cacheData(
  key: string, 
  data: any, 
  options: CacheOptions = {}
): void {
  const { ttl = 300000, storage = 'memory' } = options; // Default 5 minutes
  const cacheKey = options.key || key;

  switch (storage) {
    case 'memory':
      memoryCache.set(cacheKey, data, ttl);
      break;
    
    case 'sessionStorage':
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const expires = Date.now() + ttl;
        window.sessionStorage.setItem(cacheKey, JSON.stringify({ data, expires }));
      }
      break;
    
    case 'localStorage':
      if (typeof window !== 'undefined' && window.localStorage) {
        const expires = Date.now() + ttl;
        window.localStorage.setItem(cacheKey, JSON.stringify({ data, expires }));
      }
      break;
  }
}

/**
 * Retrieve cached data
 */
export function getCachedData(
  key: string, 
  options: CacheOptions = {}
): any | null {
  const { storage = 'memory' } = options;
  const cacheKey = options.key || key;

  switch (storage) {
    case 'memory':
      return memoryCache.get(cacheKey);
    
    case 'sessionStorage':
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const cached = window.sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, expires } = JSON.parse(cached);
          if (Date.now() <= expires) {
            return data;
          }
          window.sessionStorage.removeItem(cacheKey);
        }
      }
      break;
    
    case 'localStorage':
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          const { data, expires } = JSON.parse(cached);
          if (Date.now() <= expires) {
            return data;
          }
          window.localStorage.removeItem(cacheKey);
        }
      }
      break;
  }

  return null;
}

// Prefetching utilities
/**
 * Prefetch blog post content
 */
export function prefetchBlogPost(slug: string): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/blog/${slug}`;
    document.head.appendChild(link);
  }
}

/**
 * Prefetch multiple blog posts
 */
export function prefetchBlogPosts(slugs: string[]): void {
  slugs.forEach(slug => prefetchBlogPost(slug));
}

// Performance monitoring utilities
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

/**
 * Measure blog page performance
 */
export function measureBlogPerformance(): PerformanceMetrics {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0
    };
  }

  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = window.performance.getEntriesByType('paint');
  
  const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
  const largestContentfulPaint = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0;

  const metrics: PerformanceMetrics = {
    loadTime: navigation.loadEventEnd - navigation.navigationStart,
    renderTime: firstContentfulPaint,
    interactionTime: largestContentfulPaint,
  };

  // Add memory usage if available
  if ('memory' in window.performance) {
    const memory = (window.performance as any).memory;
    metrics.memoryUsage = memory.usedJSHeapSize;
  }

  return metrics;
}

// Image compression utilities
/**
 * Compress image client-side before upload
 */
export function compressImage(
  file: File, 
  maxWidth = 1200, 
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Bundle size optimization utilities
/**
 * Dynamically import components to reduce initial bundle size
 */
export const lazy = {
  // Lazy load heavy components
  TableOfContents: () => import('../components/blog/TableOfContents'),
  ReadingProgress: () => import('../components/blog/ReadingProgress'),
  ShareButtons: () => import('../components/blog/ShareButtons'),
  
  // Lazy load search functionality
  SearchBar: () => import('../components/blog/SearchBar'),
  
  // Lazy load chart libraries (if needed)
  Charts: () => import('recharts'),
};

// Service Worker utilities for caching
export interface ServiceWorkerConfig {
  cacheFirstPaths: string[];
  networkFirstPaths: string[];
  cacheName: string;
}

/**
 * Register service worker for blog caching
 */
export function registerBlogServiceWorker(config: ServiceWorkerConfig): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/blog-sw.js').then((registration) => {
      console.log('Blog Service Worker registered:', registration);
      
      // Send config to service worker
      registration.active?.postMessage({ type: 'CONFIG', config });
    }).catch((error) => {
      console.error('Blog Service Worker registration failed:', error);
    });
  }
}

// Critical CSS extraction
export const criticalCSS = `
  /* Critical styles for above-the-fold content */
  .blog-critical {
    font-family: 'Noto Sans TC', sans-serif;
    line-height: 1.6;
  }
  
  .blog-skeleton {
    background: linear-gradient(90deg, #f0f0f0 0%, rgba(255,255,255,0.8) 50%, #f0f0f0 100%);
    background-size: 200px 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }
  
  @keyframes skeleton-loading {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
`;

// Font loading optimization
export function optimizeWebFonts(): void {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const fonts = [
      'Noto Sans TC',
      'Noto Serif TC'
    ];
    
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = `/fonts/${font.replace(/\s+/g, '-').toLowerCase()}.woff2`;
      document.head.appendChild(link);
    });
  }
}

export default {
  generateOptimizedImageProps,
  generateBlurPlaceholder,
  createLazyLoader,
  cacheData,
  getCachedData,
  prefetchBlogPost,
  prefetchBlogPosts,
  measureBlogPerformance,
  compressImage,
  lazy,
  registerBlogServiceWorker,
  criticalCSS,
  optimizeWebFonts
};