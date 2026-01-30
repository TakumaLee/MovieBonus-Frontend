/**
 * AMP (Accelerated Mobile Pages) Utilities
 * 
 * This module provides utilities for generating AMP-compliant content
 * and optimizations for better mobile performance.
 */

import { BlogPost } from './types';

export interface AmpImageDimensions {
  width: number;
  height: number;
}

export interface AmpOptimizationOptions {
  removeInlineStyles?: boolean;
  optimizeImages?: boolean;
  removeUnsupportedTags?: boolean;
  addStructuredData?: boolean;
  minifyHtml?: boolean;
}

/**
 * AMP Content Processor class
 */
export class AmpContentProcessor {
  private options: Required<AmpOptimizationOptions>;

  constructor(options: AmpOptimizationOptions = {}) {
    this.options = {
      removeInlineStyles: options.removeInlineStyles ?? true,
      optimizeImages: options.optimizeImages ?? true,
      removeUnsupportedTags: options.removeUnsupportedTags ?? true,
      addStructuredData: options.addStructuredData ?? true,
      minifyHtml: options.minifyHtml ?? true,
    };
  }

  /**
   * Process content for AMP compatibility
   */
  processContent(content: string, post: BlogPost): string {
    let processedContent = content;

    // Remove inline styles
    if (this.options.removeInlineStyles) {
      processedContent = this.removeInlineStyles(processedContent);
    }

    // Optimize images for AMP
    if (this.options.optimizeImages) {
      processedContent = this.convertImagesToAmpImg(processedContent, post.title);
    }

    // Remove unsupported tags
    if (this.options.removeUnsupportedTags) {
      processedContent = this.removeUnsupportedTags(processedContent);
    }

    // Minify HTML
    if (this.options.minifyHtml) {
      processedContent = this.minifyHtml(processedContent);
    }

    return processedContent;
  }

  /**
   * Remove inline styles (AMP doesn't allow them)
   */
  private removeInlineStyles(content: string): string {
    return content.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
  }

  /**
   * Convert regular img tags to amp-img
   */
  private convertImagesToAmpImg(content: string, defaultAlt: string): string {
    return content.replace(
      /<img([^>]*?)src\s*=\s*["']([^"']*?)["']([^>]*?)>/gi,
      (match, beforeSrc, src, afterSrc) => {
        // Extract existing attributes
        const attributes = this.extractImageAttributes(match);
        const width = attributes.width || '800';
        const height = attributes.height || '450';
        const alt = attributes.alt || defaultAlt;
        const title = attributes.title || '';
        
        // Build amp-img tag
        return `<amp-img 
          src="${src}" 
          alt="${this.escapeAttribute(alt)}" 
          width="${width}" 
          height="${height}" 
          layout="responsive"${title ? ` title="${this.escapeAttribute(title)}"` : ''}
        ></amp-img>`;
      }
    );
  }

  /**
   * Extract image attributes from img tag
   */
  private extractImageAttributes(imgTag: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Extract width
    const widthMatch = imgTag.match(/width\s*=\s*["']?(\d+)["']?/i);
    if (widthMatch) attributes.width = widthMatch[1];
    
    // Extract height
    const heightMatch = imgTag.match(/height\s*=\s*["']?(\d+)["']?/i);
    if (heightMatch) attributes.height = heightMatch[1];
    
    // Extract alt
    const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i);
    if (altMatch) attributes.alt = altMatch[1];
    
    // Extract title
    const titleMatch = imgTag.match(/title\s*=\s*["']([^"']*)["']/i);
    if (titleMatch) attributes.title = titleMatch[1];
    
    return attributes;
  }

  /**
   * Remove tags that are not supported in AMP
   */
  private removeUnsupportedTags(content: string): string {
    // List of unsupported tags in AMP
    const unsupportedTags = [
      'script',
      'iframe',
      'object',
      'embed',
      'applet',
      'form',
      'input',
      'button',
      'select',
      'textarea',
      'audio',
      'video'
    ];

    let cleanContent = content;

    unsupportedTags.forEach(tag => {
      // Remove opening and closing tags with content
      const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
      cleanContent = cleanContent.replace(regex, '');
      
      // Remove self-closing tags
      const selfClosingRegex = new RegExp(`<${tag}[^>]*\/?>`, 'gi');
      cleanContent = cleanContent.replace(selfClosingRegex, '');
    });

    // Replace some tags with AMP equivalents
    cleanContent = cleanContent.replace(
      /<iframe([^>]*?)src\s*=\s*["']([^"']*?)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        // Convert iframe to amp-iframe (basic conversion)
        const width = this.extractAttribute(match, 'width') || '800';
        const height = this.extractAttribute(match, 'height') || '450';
        
        return `<amp-iframe 
          src="${src}" 
          width="${width}" 
          height="${height}" 
          layout="responsive" 
          sandbox="allow-scripts allow-same-origin"
        ></amp-iframe>`;
      }
    );

    return cleanContent;
  }

  /**
   * Extract attribute value from HTML tag
   */
  private extractAttribute(tag: string, attributeName: string): string | null {
    const regex = new RegExp(`${attributeName}\\s*=\\s*["']([^"']*)["']`, 'i');
    const match = tag.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Escape HTML attribute values
   */
  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Basic HTML minification
   */
  private minifyHtml(content: string): string {
    return content
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove extra whitespace between tags
      .replace(/>\s+</g, '><')
      // Remove leading/trailing whitespace
      .trim();
  }
}

/**
 * Generate AMP boilerplate CSS
 */
export function generateAmpBoilerplate(): string {
  return `<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>`;
}

/**
 * Generate AMP custom CSS with Taiwan-specific optimizations
 */
export function generateAmpCustomCSS(): string {
  return `
    /* Base styles with Taiwan-specific fonts */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans CJK TC", "PingFang TC", "Microsoft JhengHei", "微軟正黑體", sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
      background-color: #fff;
    }
    
    /* Typography for Chinese content */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      color: #111;
      margin: 1.5em 0 0.5em 0;
    }
    
    h1 { font-size: 2rem; }
    h2 { font-size: 1.75rem; border-bottom: 2px solid #2563eb; padding-bottom: 0.3rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    
    /* Paragraph styles optimized for Chinese reading */
    p {
      margin: 1rem 0;
      text-align: justify;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    
    /* List styles */
    ul, ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }
    
    li {
      margin: 0.5rem 0;
    }
    
    /* Blockquote styles */
    blockquote {
      border-left: 4px solid #2563eb;
      margin: 1.5rem 0;
      padding: 1rem 1.5rem;
      background-color: #f8f9fa;
      font-style: normal;
      color: #555;
    }
    
    /* Code styles */
    code {
      background-color: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
      font-size: 0.875rem;
    }
    
    pre {
      background-color: #1f2937;
      color: #f9fafb;
      padding: 1.5rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    
    /* Image styles */
    amp-img {
      margin: 1.5rem 0;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    /* Header styles */
    .header {
      border-bottom: 1px solid #e5e7eb;
      padding: 2rem 0;
      margin-bottom: 2rem;
    }
    
    .site-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: #2563eb;
      text-decoration: none;
      margin: 0;
    }
    
    .breadcrumb {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0.75rem 0 0 0;
    }
    
    .breadcrumb a {
      color: #2563eb;
      text-decoration: none;
    }
    
    /* Article styles */
    .article-header {
      margin-bottom: 2rem;
    }
    
    .article-title {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      color: #111;
      margin: 0 0 1rem 0;
    }
    
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 1.5rem;
      padding: 1rem 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .article-excerpt {
      font-size: 1.125rem;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: #f0f9ff;
      border-left: 4px solid #2563eb;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    
    /* Tags */
    .tags {
      margin: 2rem 0;
      padding: 1.5rem 0;
      border-top: 1px solid #e5e7eb;
    }
    
    .tags-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #374151;
    }
    
    .tag {
      display: inline-block;
      background-color: #e5e7eb;
      color: #374151;
      padding: 0.5rem 1rem;
      margin: 0.25rem 0.5rem 0.25rem 0;
      border-radius: 1rem;
      font-size: 0.875rem;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    
    .tag:hover {
      background-color: #d1d5db;
    }
    
    /* Movie info card */
    .movie-info {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 2rem 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .movie-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.75rem;
    }
    
    .movie-details {
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.6;
    }
    
    /* Related posts */
    .related-posts {
      background-color: #f8fafc;
      border-radius: 0.75rem;
      padding: 2rem;
      margin: 3rem 0;
    }
    
    .related-posts-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: #111;
    }
    
    .related-post-item {
      margin-bottom: 1.25rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .related-post-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .related-post-title {
      font-size: 1.125rem;
      font-weight: 500;
      color: #2563eb;
      text-decoration: none;
      line-height: 1.4;
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .related-post-excerpt {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.5;
    }
    
    /* Footer */
    .footer {
      margin-top: 4rem;
      padding: 2rem 0;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    
    /* Mobile optimizations */
    @media (max-width: 640px) {
      body {
        padding: 0 1rem;
      }
      
      .article-title {
        font-size: 2rem;
      }
      
      .article-meta {
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .header {
        padding: 1.5rem 0;
      }
      
      .site-title {
        font-size: 1.5rem;
      }
      
      .movie-info,
      .related-posts {
        padding: 1.25rem;
      }
    }
    
    /* Print styles */
    @media print {
      .header,
      .footer,
      .related-posts {
        display: none;
      }
      
      body {
        max-width: none;
        margin: 0;
        padding: 0;
      }
      
      .article-content {
        font-size: 12pt;
        line-height: 1.4;
      }
    }
  `;
}

/**
 * Validate if content is AMP-compatible
 */
export function validateAmpContent(content: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for inline styles
  if (content.includes('style=')) {
    errors.push('Inline styles are not allowed in AMP');
  }

  // Check for script tags
  if (content.includes('<script')) {
    errors.push('Script tags are not allowed in AMP (except for structured data)');
  }

  // Check for iframe tags
  if (content.includes('<iframe')) {
    warnings.push('iframe tags should be replaced with amp-iframe');
  }

  // Check for regular img tags
  if (content.includes('<img')) {
    warnings.push('img tags should be replaced with amp-img');
  }

  // Check for form elements
  if (content.match(/<(form|input|button|select|textarea)/i)) {
    errors.push('Form elements require amp-form component');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate AMP analytics configuration
 */
export function generateAmpAnalytics(gaTrackingId?: string): string {
  if (!gaTrackingId) {
    return '';
  }

  return `
    <amp-analytics type="gtag" data-credentials="include">
      <script type="application/json">
      {
        "vars": {
          "gtag_id": "${gaTrackingId}",
          "config": {
            "${gaTrackingId}": {
              "groups": "default"
            }
          }
        },
        "triggers": {
          "pageview": {
            "on": "visible",
            "request": "pageview"
          },
          "click": {
            "on": "click",
            "selector": "a[href*=\"/blog/\"]",
            "request": "event",
            "vars": {
              "event_name": "internal_link_click",
              "event_category": "engagement"
            }
          }
        }
      }
      </script>
    </amp-analytics>
  `;
}

/**
 * Calculate optimal image dimensions for AMP
 */
export function calculateAmpImageDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number = 800
): AmpImageDimensions {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalHeight / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio)
  };
}

export default {
  AmpContentProcessor,
  generateAmpBoilerplate,
  generateAmpCustomCSS,
  validateAmpContent,
  generateAmpAnalytics,
  calculateAmpImageDimensions
};