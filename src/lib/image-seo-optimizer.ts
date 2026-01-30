/**
 * Image SEO Optimizer
 * 
 * This module provides utilities for optimizing images for SEO,
 * including automatic alt text generation, image compression suggestions,
 * and structured data for images.
 */

import { BlogPost, Movie } from './types';

export interface ImageOptimizationSuggestion {
  src: string;
  currentAlt?: string;
  suggestedAlt: string;
  title?: string;
  caption?: string;
  reasons: string[];
  seoScore: number; // 0-100
  improvements: string[];
}

export interface ImageSEOData {
  url: string;
  alt: string;
  title?: string;
  caption?: string;
  context?: string;
  structuredData?: any;
}

export interface ImageAnalysisResult {
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  duplicateAltTexts: string[];
  tooShortAltTexts: ImageOptimizationSuggestion[];
  tooLongAltTexts: ImageOptimizationSuggestion[];
  genericAltTexts: ImageOptimizationSuggestion[];
  optimizedImages: ImageOptimizationSuggestion[];
  seoScore: number;
}

/**
 * Image SEO Optimizer class
 */
export class ImageSEOOptimizer {
  private readonly IDEAL_ALT_LENGTH_MIN = 10;
  private readonly IDEAL_ALT_LENGTH_MAX = 125;
  private readonly GENERIC_ALT_PATTERNS = [
    /^image$/i,
    /^photo$/i,
    /^picture$/i,
    /^圖片$/i,
    /^照片$/i,
    /^圖像$/i,
    /^img\d*$/i,
    /^photo\d*$/i,
    /^image\d*$/i,
    /^screenshot$/i,
    /^螢幕截圖$/i,
  ];

  /**
   * Generate optimized alt text for images in blog content
   */
  generateAltText(
    imageSrc: string,
    context: {
      post: BlogPost;
      surroundingText?: string;
      imagePosition?: number;
      isFeatureImage?: boolean;
    }
  ): string {
    const { post, surroundingText, imagePosition = 1, isFeatureImage = false } = context;
    
    let altText = '';
    
    // Base alt text from post title
    altText = post.title;
    
    // Add context from surrounding text if available
    if (surroundingText) {
      const contextKeywords = this.extractContextKeywords(surroundingText);
      if (contextKeywords.length > 0) {
        altText = `${contextKeywords.slice(0, 2).join(' ')} - ${altText}`;
      }
    }
    
    // Add movie context if available
    if (post.primary_movie) {
      const movieTitle = post.primary_movie.title;
      if (!altText.includes(movieTitle)) {
        altText = `${movieTitle} ${altText}`;
      }
    }
    
    // Add category context
    if (post.category && !altText.toLowerCase().includes(post.category.name.toLowerCase())) {
      altText = `${altText} - ${post.category.name}`;
    }
    
    // Add positional context for multiple images
    if (imagePosition > 1 && !isFeatureImage) {
      altText = `${altText} (圖${imagePosition})`;
    }
    
    // Add feature image context
    if (isFeatureImage) {
      altText = `${altText} - 特色圖片`;
    }
    
    // Add site branding
    if (!altText.includes('特典速報') && !altText.includes('パルパル')) {
      altText = `${altText} - 特典速報 パルパル`;
    }
    
    // Clean up and optimize
    altText = this.cleanupAltText(altText);
    
    // Ensure optimal length
    if (altText.length > this.IDEAL_ALT_LENGTH_MAX) {
      altText = this.truncateAltText(altText);
    }
    
    return altText;
  }

  /**
   * Analyze images in blog post content
   */
  analyzePostImages(post: BlogPost): ImageAnalysisResult {
    const images = this.extractImagesFromContent(post.content);
    const analysis: ImageAnalysisResult = {
      totalImages: images.length,
      imagesWithAlt: 0,
      imagesWithoutAlt: 0,
      duplicateAltTexts: [],
      tooShortAltTexts: [],
      tooLongAltTexts: [],
      genericAltTexts: [],
      optimizedImages: [],
      seoScore: 0
    };

    const altTexts: string[] = [];

    images.forEach((image, index) => {
      const suggestion: ImageOptimizationSuggestion = {
        src: image.src,
        currentAlt: image.alt,
        suggestedAlt: '',
        reasons: [],
        seoScore: 0,
        improvements: []
      };

      // Check if alt text exists
      if (!image.alt || image.alt.trim() === '') {
        analysis.imagesWithoutAlt++;
        suggestion.reasons.push('Missing alt text');
        suggestion.improvements.push('Add descriptive alt text');
        suggestion.seoScore = 0;
      } else {
        analysis.imagesWithAlt++;
        const altText = image.alt.trim();
        altTexts.push(altText);

        // Check alt text length
        if (altText.length < this.IDEAL_ALT_LENGTH_MIN) {
          analysis.tooShortAltTexts.push(suggestion);
          suggestion.reasons.push('Alt text too short');
          suggestion.improvements.push('Add more descriptive details');
          suggestion.seoScore -= 20;
        } else if (altText.length > this.IDEAL_ALT_LENGTH_MAX) {
          analysis.tooLongAltTexts.push(suggestion);
          suggestion.reasons.push('Alt text too long');
          suggestion.improvements.push('Shorten to under 125 characters');
          suggestion.seoScore -= 15;
        }

        // Check for generic alt text
        if (this.isGenericAltText(altText)) {
          analysis.genericAltTexts.push(suggestion);
          suggestion.reasons.push('Generic alt text');
          suggestion.improvements.push('Use more specific, descriptive text');
          suggestion.seoScore -= 30;
        }

        // Base score for having alt text
        suggestion.seoScore += 60;
      }

      // Generate improved alt text
      suggestion.suggestedAlt = this.generateAltText(image.src, {
        post,
        surroundingText: image.context,
        imagePosition: index + 1
      });

      // Calculate improvement score
      if (suggestion.suggestedAlt !== image.alt) {
        suggestion.improvements.push('Use suggested alt text for better SEO');
      }

      // Ensure minimum score
      suggestion.seoScore = Math.max(0, Math.min(100, suggestion.seoScore + 40));

      analysis.optimizedImages.push(suggestion);
    });

    // Check for duplicate alt texts
    const duplicates = altTexts.filter((alt, index) => 
      altTexts.indexOf(alt) !== index && alt.length > 0
    );
    analysis.duplicateAltTexts = [...new Set(duplicates)];

    // Calculate overall SEO score
    const totalPossibleScore = images.length * 100;
    const actualScore = analysis.optimizedImages.reduce((sum, img) => sum + img.seoScore, 0);
    analysis.seoScore = totalPossibleScore > 0 ? Math.round((actualScore / totalPossibleScore) * 100) : 0;

    return analysis;
  }

  /**
   * Generate structured data for images
   */
  generateImageStructuredData(
    image: ImageSEOData,
    post: BlogPost
  ): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      url: image.url,
      name: image.alt,
      alternateName: image.title,
      description: image.caption || image.alt,
      author: post.author ? {
        '@type': 'Person',
        name: post.author.name
      } : {
        '@type': 'Organization',
        name: '特典速報 パルパル'
      },
      copyrightHolder: {
        '@type': 'Organization',
        name: '特典速報 パルパル'
      },
      contentUrl: image.url,
      // Add context about what the image depicts
      ...(post.primary_movie && {
        about: {
          '@type': 'Movie',
          name: post.primary_movie.title
        }
      })
    };
  }

  /**
   * Extract images from HTML content
   */
  private extractImagesFromContent(content: string): Array<{
    src: string;
    alt?: string;
    title?: string;
    context?: string;
  }> {
    const images: Array<{
      src: string;
      alt?: string;
      title?: string;
      context?: string;
    }> = [];

    // Regex to match img tags
    const imgRegex = /<img[^>]*>/gi;
    const matches = content.matchAll(imgRegex);

    for (const match of matches) {
      const imgTag = match[0];
      const imgIndex = match.index || 0;
      
      // Extract src
      const srcMatch = imgTag.match(/src\s*=\s*["']([^"']*)["']/i);
      if (!srcMatch) continue;
      
      // Extract alt
      const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i);
      
      // Extract title
      const titleMatch = imgTag.match(/title\s*=\s*["']([^"']*)["']/i);
      
      // Extract surrounding context
      const contextStart = Math.max(0, imgIndex - 200);
      const contextEnd = Math.min(content.length, imgIndex + 200);
      const context = content.slice(contextStart, contextEnd)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      images.push({
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : undefined,
        title: titleMatch ? titleMatch[1] : undefined,
        context
      });
    }

    return images;
  }

  /**
   * Extract keywords from surrounding text context
   */
  private extractContextKeywords(text: string): string[] {
    // Clean text and split into words
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/[^\w\s\u4e00-\u9fff]/g, ' ');
    const words = cleanText.split(/\s+/).filter(word => word.length > 1);
    
    // Filter out stop words
    const stopWords = [
      '的', '是', '在', '有', '和', '或', '但', '這', '那', '了', '就', '都', '要', '可以', '會', '能',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'
    ];
    
    const keywords = words.filter(word => 
      !stopWords.includes(word.toLowerCase()) && word.length > 2
    );
    
    // Return most relevant keywords (first few meaningful words)
    return keywords.slice(0, 3);
  }

  /**
   * Check if alt text is generic
   */
  private isGenericAltText(altText: string): boolean {
    return this.GENERIC_ALT_PATTERNS.some(pattern => pattern.test(altText));
  }

  /**
   * Clean up alt text
   */
  private cleanupAltText(altText: string): string {
    return altText
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Remove leading/trailing spaces
      .trim()
      // Remove duplicate phrases
      .replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1')
      // Capitalize first letter
      .replace(/^./, char => char.toUpperCase());
  }

  /**
   * Truncate alt text to optimal length
   */
  private truncateAltText(altText: string): string {
    if (altText.length <= this.IDEAL_ALT_LENGTH_MAX) {
      return altText;
    }

    // Try to truncate at word boundary
    let truncated = altText.substring(0, this.IDEAL_ALT_LENGTH_MAX - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > this.IDEAL_ALT_LENGTH_MAX * 0.7) {
      truncated = truncated.substring(0, lastSpace);
    }
    
    return truncated + '...';
  }

  /**
   * Generate image sitemap data
   */
  generateImageSitemapData(post: BlogPost): Array<{
    loc: string;
    title: string;
    caption?: string;
  }> {
    const images = this.extractImagesFromContent(post.content);
    const imageSitemapData: Array<{
      loc: string;
      title: string;
      caption?: string;
    }> = [];

    // Add feature image
    if (post.cover_image) {
      imageSitemapData.push({
        loc: post.cover_image,
        title: `${post.title} - 特色圖片`,
        caption: post.excerpt || post.title
      });
    }

    // Add content images
    images.forEach((image, index) => {
      if (image.src && !image.src.startsWith('data:')) {
        const optimizedAlt = this.generateAltText(image.src, {
          post,
          surroundingText: image.context,
          imagePosition: index + 1
        });

        imageSitemapData.push({
          loc: image.src,
          title: optimizedAlt,
          caption: image.context?.substring(0, 160) || optimizedAlt
        });
      }
    });

    return imageSitemapData;
  }
}

/**
 * Image performance optimization utilities
 */
export class ImagePerformanceOptimizer {
  /**
   * Generate Next.js Image component props with optimizations
   */
  generateNextImageProps(
    src: string,
    alt: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      priority?: boolean;
      sizes?: string;
    } = {}
  ) {
    const {
      width = 800,
      height = 450,
      quality = 85,
      priority = false,
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    } = options;

    return {
      src,
      alt,
      width,
      height,
      quality,
      priority,
      sizes,
      loading: priority ? 'eager' : 'lazy',
      placeholder: 'blur' as const,
      blurDataURL: this.generateBlurDataURL(),
    };
  }

  /**
   * Generate blur data URL for placeholder
   */
  private generateBlurDataURL(): string {
    // Simple 1x1 pixel blur data URL
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAhEQABBAEDBQAAAAAAAAAAAAABAAIDBAUGETFRkbHB/9oADAMBAAIRAxEAPwCdwLjU7CLYb2+iBgjPlFBrrX2OIzcqJWjUYx6yOPNFFP/Z';
  }

  /**
   * Calculate responsive image sizes
   */
  calculateResponsiveSizes(
    breakpoints: Array<{ size: number; vw: number }> = [
      { size: 640, vw: 100 },
      { size: 768, vw: 80 },
      { size: 1024, vw: 60 },
      { size: 1280, vw: 50 },
    ]
  ): string {
    return breakpoints
      .map(bp => `(max-width: ${bp.size}px) ${bp.vw}vw`)
      .join(', ') + ', 33vw';
  }
}

/**
 * Utility functions
 */
export function optimizeImageForSEO(
  src: string,
  context: {
    post: BlogPost;
    surroundingText?: string;
    imagePosition?: number;
    isFeatureImage?: boolean;
  }
): ImageSEOData {
  const optimizer = new ImageSEOOptimizer();
  const performanceOptimizer = new ImagePerformanceOptimizer();
  
  const alt = optimizer.generateAltText(src, context);
  const title = `${context.post.title} - 圖片${context.imagePosition || 1}`;
  
  return {
    url: src,
    alt,
    title,
    context: context.surroundingText,
    structuredData: optimizer.generateImageStructuredData(
      { url: src, alt, title },
      context.post
    )
  };
}

export function generateImageSEOReport(post: BlogPost): ImageAnalysisResult {
  const optimizer = new ImageSEOOptimizer();
  return optimizer.analyzePostImages(post);
}

export default {
  ImageSEOOptimizer,
  ImagePerformanceOptimizer,
  optimizeImageForSEO,
  generateImageSEOReport
};