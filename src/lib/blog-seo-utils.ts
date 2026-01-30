/**
 * Blog SEO Utilities
 * 
 * This module provides SEO optimization functions for blog pages,
 * including metadata generation, structured data, and Open Graph tags.
 */

import { Metadata } from 'next';
import { BlogPost, BlogCategory, BlogSEOData } from './types';

const SITE_NAME = '特典速報 パルパル';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://paruparu.vercel.app';
const DEFAULT_OG_IMAGE = '/og-image.png';

/**
 * Generate metadata for blog homepage
 */
export function generateBlogHomeMetadata(): Metadata {
  const title = `電影部落格 | ${SITE_NAME} - 台灣電影特典資訊與觀影指南`;
  const description = '探索最新電影資訊、特典情報、觀影指南與影評分析。台灣最完整的電影部落格，為影迷提供專業的電影內容與限定商品資訊。';
  const url = `${SITE_URL}/blog`;

  return {
    title,
    description,
    keywords: [
      '電影部落格', '電影評論', '電影特典', '觀影指南',
      '電影資訊', '影評', '電影新聞', '台灣電影',
      'movie blog', 'film review', 'cinema news',
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'zh_TW',
      images: [{
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: '特典速報部落格 - 電影資訊與特典情報'
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
      types: {
        'application/rss+xml': `${SITE_URL}/blog/rss.xml`,
      },
    },
  };
}

/**
 * Generate metadata for individual blog post
 */
export function generateBlogPostMetadata(
  post: BlogPost,
  seoData?: BlogSEOData | null
): Metadata {
  const title = seoData?.title || post.seo_title || `${post.title} | ${SITE_NAME}`;
  const description = seoData?.description || post.seo_description || post.excerpt || 
    post.content.substring(0, 160) + '...';
  const url = `${SITE_URL}/blog/${post.slug}`;
  const imageUrl = post.cover_image || seoData?.og_image || DEFAULT_OG_IMAGE;
  
  // Keywords from SEO data, post tags, and defaults
  const keywords = [
    ...(seoData?.keywords || []),
    ...post.tags,
    '電影', '特典', '觀影指南',
  ];

  const publishedTime = post.published_at || post.created_at;
  const modifiedTime = post.updated_at;

  const metadata: Metadata = {
    title,
    description,
    keywords,
    authors: post.author ? [{ name: post.author.name }] : undefined,
    openGraph: {
      title: seoData?.og_title || post.og_title || title,
      description: seoData?.og_description || post.og_description || description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      locale: 'zh_TW',
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: post.title
      }],
      publishedTime,
      modifiedTime,
      authors: post.author ? [post.author.name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData?.twitter_title || post.twitter_title || title,
      description: seoData?.twitter_description || post.twitter_description || description,
      images: [post.twitter_image || imageUrl],
    },
    alternates: {
      canonical: seoData?.canonical_url || post.canonical_url || url,
    },
  };

  return metadata;
}

/**
 * Generate metadata for blog category pages
 */
export function generateBlogCategoryMetadata(category: BlogCategory): Metadata {
  const title = `${category.name} | ${SITE_NAME} - 電影特典資訊`;
  const description = category.description || 
    `瀏覽 ${category.name} 相關的電影文章，包含最新資訊、特典情報與觀影指南。專業的電影內容，盡在特典速報。`;
  const url = `${SITE_URL}/blog/category/${category.slug}`;

  return {
    title,
    description,
    keywords: [
      category.name,
      '電影分類', '電影資訊', '特典情報',
      'movie category', 'film news',
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'zh_TW',
      images: [{
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${category.name} - 特典速報`
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate metadata for blog tag pages
 */
export function generateBlogTagMetadata(tag: string): Metadata {
  const title = `#${tag} | ${SITE_NAME} - 相關文章`;
  const description = `查看所有標籤為「${tag}」的電影文章。包含相關的電影資訊、特典情報與觀影指南。`;
  const url = `${SITE_URL}/blog/tag/${encodeURIComponent(tag)}`;

  return {
    title,
    description,
    keywords: [
      tag,
      '電影標籤', '相關文章', '電影資訊',
      'movie tag', 'related posts',
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'zh_TW',
      images: [{
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${tag} 相關文章 - 特典速報`
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate metadata for blog search pages
 */
export function generateBlogSearchMetadata(query: string): Metadata {
  const title = query 
    ? `搜尋「${query}」| ${SITE_NAME} - 文章搜尋結果`
    : `文章搜尋 | ${SITE_NAME} - 探索電影內容`;
  
  const description = query
    ? `搜尋「${query}」的相關電影文章和資訊。找到最符合您需求的電影內容、特典情報與觀影指南。`
    : '搜尋電影相關文章、特典資訊與觀影指南。使用我們的搜尋功能，快速找到您感興趣的電影內容。';
  
  const url = query 
    ? `${SITE_URL}/blog/search?q=${encodeURIComponent(query)}`
    : `${SITE_URL}/blog/search`;

  return {
    title,
    description,
    keywords: [
      '文章搜尋', '電影搜尋', '內容搜尋',
      query ? `${query}相關` : '',
      'blog search', 'movie search',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'zh_TW',
      images: [{
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: query ? `搜尋「${query}」- 特典速報` : '文章搜尋 - 特典速報'
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: !query, // Don't index search result pages with queries
      follow: true,
    },
  };
}

/**
 * Generate JSON-LD structured data for blog post
 */
export function generateBlogPostStructuredData(post: BlogPost): any {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.cover_image ? {
      '@type': 'ImageObject',
      url: post.cover_image,
      width: 1200,
      height: 630,
      alt: `${post.title} - ${SITE_NAME}`
    } : undefined,
    author: post.author ? {
      '@type': 'Person',
      name: post.author.name,
      description: post.author.bio,
      url: post.author.social_links?.twitter ? `https://twitter.com/${post.author.social_links.twitter}` : undefined,
      sameAs: [
        post.author.social_links?.twitter ? `https://twitter.com/${post.author.social_links.twitter}` : '',
        post.author.social_links?.facebook ? `https://facebook.com/${post.author.social_links.facebook}` : '',
      ].filter(Boolean)
    } : {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 200,
        height: 60
      },
      url: SITE_URL,
      sameAs: [
        'https://www.facebook.com/moviebonus',
        'https://twitter.com/moviebonus',
        'https://line.me/ti/p/@moviebonus'
      ]
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    articleSection: post.category?.name,
    keywords: post.tags.join(', '),
    wordCount: post.content.split(/\s+/).length,
    timeRequired: `PT${post.reading_time || calculateReadingTime(post.content)}M`,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`
    },
    isPartOf: {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog`,
      name: `${SITE_NAME} 電影部落格`,
      url: `${SITE_URL}/blog`
    },
    inLanguage: 'zh-TW',
    // Add movie-specific structured data if related to movies
    ...(post.primary_movie && {
      about: {
        '@type': 'Movie',
        name: post.primary_movie.title,
        alternateName: post.primary_movie.english_title,
        description: post.primary_movie.synopsis,
        datePublished: post.primary_movie.release_date,
        director: post.primary_movie.director.map(name => ({ '@type': 'Person', name })),
        actor: post.primary_movie.movie_cast.map(name => ({ '@type': 'Person', name })),
        genre: post.primary_movie.genre,
        image: post.primary_movie.poster_url,
        url: `${SITE_URL}/movie/${post.primary_movie.id}`
      }
    })
  };

  return structuredData;
}

/**
 * Generate JSON-LD structured data for blog homepage
 */
export function generateBlogHomeStructuredData(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} 電影部落格`,
    description: '台灣最完整的電影特典資訊與觀影指南部落格',
    url: `${SITE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
      }
    },
    inLanguage: 'zh-TW',
    about: {
      '@type': 'Thing',
      name: '電影',
      sameAs: 'https://zh.wikipedia.org/wiki/电影'
    }
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Extract reading time from content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200; // Average reading speed for Chinese text
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Generate social sharing URLs optimized for Taiwan
 */
export function generateSocialShareUrls(data: {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
}) {
  const encodedUrl = encodeURIComponent(data.url);
  const encodedTitle = encodeURIComponent(data.title);
  const encodedDescription = encodeURIComponent(data.description || '');
  const hashtagString = data.hashtags?.map(tag => `#${tag}`).join(' ') || '';

  return {
    // LINE is most popular in Taiwan
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`,
    
    // Facebook still important
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    
    // Twitter/X
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${hashtagString ? `&hashtags=${encodeURIComponent(hashtagString)}` : ''}`,
    
    // WhatsApp
    whatsapp: `https://wa.me/?text=${encodedTitle} ${encodedUrl}`,
    
    // Email
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    
    // Copy link (handled in frontend)
    copy: data.url
  };
}

/**
 * Optimize meta description for Chinese content
 */
export function optimizeMetaDescription(content: string, maxLength = 160): string {
  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, '');
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // For Chinese text, cut at sentence boundaries
  const sentences = cleanContent.split(/[。！？]/);
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence + '。').length > maxLength) {
      break;
    }
    result += sentence + '。';
  }
  
  return result || cleanContent.substring(0, maxLength - 3) + '...';
}

/**
 * Generate FAQ structured data for blog posts
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): any {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate Review structured data for movie review posts
 */
export function generateReviewStructuredData(
  post: BlogPost,
  rating?: { value: number; max: number; min: number }
): any {
  if (!post.primary_movie) return null;

  const reviewData: any = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Movie',
      name: post.primary_movie.title,
      alternateName: post.primary_movie.english_title,
      description: post.primary_movie.synopsis,
      director: post.primary_movie.director.map(name => ({ '@type': 'Person', name })),
      actor: post.primary_movie.movie_cast.map(name => ({ '@type': 'Person', name })),
      genre: post.primary_movie.genre,
      datePublished: post.primary_movie.release_date,
      image: post.primary_movie.poster_url
    },
    author: post.author ? {
      '@type': 'Person',
      name: post.author.name
    } : {
      '@type': 'Organization',
      name: SITE_NAME
    },
    datePublished: post.published_at || post.created_at,
    description: post.excerpt || post.content.substring(0, 160),
    inLanguage: 'zh-TW',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL
    }
  };

  if (rating) {
    reviewData.reviewRating = {
      '@type': 'Rating',
      ratingValue: rating.value,
      bestRating: rating.max,
      worstRating: rating.min
    };
  }

  return reviewData;
}

/**
 * Generate How-to structured data for guide posts
 */
export function generateHowToStructuredData(
  post: BlogPost,
  steps: Array<{ name: string; text: string; image?: string }>
): any {
  if (!steps || steps.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.cover_image ? {
      '@type': 'ImageObject',
      url: post.cover_image
    } : undefined,
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'TWD',
      value: '0'
    },
    supply: steps.some(step => step.name.includes('需要') || step.name.includes('準備')) ? [
      {
        '@type': 'HowToSupply',
        name: '電影票或相關證明'
      }
    ] : undefined,
    tool: [
      {
        '@type': 'HowToTool',
        name: '手機或電腦'
      }
    ],
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && {
        image: {
          '@type': 'ImageObject',
          url: step.image
        }
      })
    })),
    totalTime: `PT${post.reading_time || calculateReadingTime(post.content)}M`,
    author: post.author ? {
      '@type': 'Person',
      name: post.author.name
    } : {
      '@type': 'Organization',
      name: SITE_NAME
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at
  };
}

/**
 * Generate enhanced breadcrumb structured data with movie context
 */
export function generateEnhancedBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
  post?: BlogPost
): any {
  const breadcrumbItems = [...items];

  // Add movie breadcrumb if post is movie-related
  if (post?.primary_movie) {
    const movieIndex = breadcrumbItems.findIndex(item => item.name === post.title);
    if (movieIndex > 0) {
      breadcrumbItems.splice(movieIndex, 0, {
        name: post.primary_movie.title,
        url: `${SITE_URL}/movie/${post.primary_movie.id}`
      });
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': item.url,
        name: item.name
      }
    }))
  };
}

/**
 * Generate video structured data for posts with embedded videos
 */
export function generateVideoStructuredData(
  post: BlogPost,
  videoData: {
    embedUrl: string;
    thumbnailUrl: string;
    duration?: string; // ISO 8601 duration format
    uploadDate?: string;
    description?: string;
  }
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: post.title,
    description: videoData.description || post.excerpt || post.content.substring(0, 160),
    thumbnailUrl: videoData.thumbnailUrl,
    embedUrl: videoData.embedUrl,
    contentUrl: videoData.embedUrl,
    duration: videoData.duration,
    uploadDate: videoData.uploadDate || post.published_at || post.created_at,
    author: post.author ? {
      '@type': 'Person',
      name: post.author.name
    } : {
      '@type': 'Organization',
      name: SITE_NAME
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
      }
    },
    inLanguage: 'zh-TW'
  };
}

/**
 * Extract FAQ content from blog post content
 */
export function extractFAQsFromContent(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Look for FAQ patterns in content
  const faqPatterns = [
    /(?:問題?|Q|Question)[:：]\s*(.+?)(?:\r?\n|\r)(?:答案?|A|Answer)[:：]\s*(.+?)(?=(?:\r?\n|\r)(?:問題?|Q|Question)|$)/g,
    /#{2,3}\s*(.+\?)\s*(?:\r?\n|\r)(.+?)(?=#{2,3}|$)/g,
    /<dt[^>]*>(.+?)<\/dt>\s*<dd[^>]*>(.+?)<\/dd>/g
  ];

  faqPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const question = match[1].trim().replace(/<[^>]*>/g, '');
      const answer = match[2].trim().replace(/<[^>]*>/g, '');
      
      if (question && answer && question.length > 10 && answer.length > 10) {
        faqs.push({ question, answer });
      }
    }
  });

  return faqs;
}

/**
 * Extract steps for How-to structured data
 */
export function extractStepsFromContent(content: string): Array<{ name: string; text: string; image?: string }> {
  const steps: Array<{ name: string; text: string; image?: string }> = [];
  
  // Look for numbered steps or ordered lists
  const stepPatterns = [
    /(?:步驟|Step)\s*(\d+)[:：]\s*(.+?)(?=(?:步驟|Step)\s*\d+|$)/g,
    /<ol[^>]*>[\s\S]*?<\/ol>/g,
    /(\d+)\.?\s*(.+?)(?=\d+\.|$)/g
  ];

  // Extract from ordered lists
  const olMatch = content.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
  if (olMatch) {
    const listContent = olMatch[1];
    const listItems = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/g);
    
    if (listItems) {
      listItems.forEach((item, index) => {
        const text = item.replace(/<[^>]*>/g, '').trim();
        if (text.length > 10) {
          steps.push({
            name: `步驟 ${index + 1}`,
            text: text
          });
        }
      });
    }
  }

  return steps;
}

/**
 * Generate image optimization suggestions for SEO
 */
export function generateImageOptimizationSuggestions(post: BlogPost): {
  coverImage?: string;
  contentImages?: Array<{ src: string; suggestedAlt: string }>;
} {
  const suggestions: any = {};
  
  // Cover image alt suggestion
  if (post.cover_image) {
    suggestions.coverImage = `${post.title} - ${post.category?.name || '電影'} - ${SITE_NAME}`;
  }
  
  // Extract images from content and suggest alt text
  const imageRegex = /<img[^>]+src=['"]([^'"]+)['"][^>]*>/g;
  const contentImages = [];
  let match;
  
  while ((match = imageRegex.exec(post.content)) !== null) {
    const src = match[1];
    let suggestedAlt = `${post.title}`;
    
    // Add context based on surrounding text
    const imgIndex = match.index;
    const beforeText = post.content.substring(Math.max(0, imgIndex - 100), imgIndex);
    const afterText = post.content.substring(imgIndex, imgIndex + 100);
    
    // Look for descriptive context
    const contextClues = [...beforeText.matchAll(/([^。！？\n]{10,50})/g), ...afterText.matchAll(/([^。！？\n]{10,50})/g)];
    if (contextClues.length > 0) {
      suggestedAlt += ` - ${contextClues[0][1].trim()}`;
    }
    
    if (post.primary_movie) {
      suggestedAlt += ` - ${post.primary_movie.title}`;
    }
    
    suggestedAlt += ` - ${SITE_NAME}`;
    
    contentImages.push({
      src,
      suggestedAlt: suggestedAlt.substring(0, 125) // Keep alt text under 125 characters
    });
  }
  
  if (contentImages.length > 0) {
    suggestions.contentImages = contentImages;
  }
  
  return suggestions;
}

export default {
  generateBlogHomeMetadata,
  generateBlogPostMetadata,
  generateBlogCategoryMetadata,
  generateBlogTagMetadata,
  generateBlogSearchMetadata,
  generateBlogPostStructuredData,
  generateBlogHomeStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
  generateReviewStructuredData,
  generateHowToStructuredData,
  generateEnhancedBreadcrumbStructuredData,
  generateVideoStructuredData,
  extractFAQsFromContent,
  extractStepsFromContent,
  generateImageOptimizationSuggestions,
  calculateReadingTime,
  generateSocialShareUrls,
  optimizeMetaDescription,
};