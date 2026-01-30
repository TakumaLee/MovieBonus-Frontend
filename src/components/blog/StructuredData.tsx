'use client';

import { useMemo } from 'react';
import Head from 'next/head';
import { BlogPost } from '@/lib/types';
import {
  generateBlogPostStructuredData,
  generateFAQStructuredData,
  generateReviewStructuredData,
  generateHowToStructuredData,
  generateEnhancedBreadcrumbStructuredData,
  generateVideoStructuredData,
  extractFAQsFromContent,
  extractStepsFromContent
} from '@/lib/blog-seo-utils';

interface StructuredDataProps {
  post: BlogPost;
  breadcrumbItems?: Array<{ name: string; url: string }>;
  rating?: { value: number; max: number; min: number };
  videoData?: {
    embedUrl: string;
    thumbnailUrl: string;
    duration?: string;
    uploadDate?: string;
    description?: string;
  };
  customStructuredData?: any[];
}

export default function StructuredData({
  post,
  breadcrumbItems = [],
  rating,
  videoData,
  customStructuredData = []
}: StructuredDataProps) {
  const structuredDataItems = useMemo(() => {
    const items: any[] = [];

    // 1. Basic Article structured data
    const articleData = generateBlogPostStructuredData(post);
    if (articleData) {
      items.push(articleData);
    }

    // 2. Enhanced breadcrumbs with movie context
    if (breadcrumbItems.length > 0) {
      const breadcrumbData = generateEnhancedBreadcrumbStructuredData(breadcrumbItems, post);
      if (breadcrumbData) {
        items.push(breadcrumbData);
      }
    }

    // 3. FAQ structured data (auto-extracted)
    const faqs = extractFAQsFromContent(post.content);
    if (faqs.length > 0) {
      const faqData = generateFAQStructuredData(faqs);
      if (faqData) {
        items.push(faqData);
      }
    }

    // 4. Review structured data (for movie reviews)
    if (post.primary_movie && isReviewPost(post)) {
      const reviewData = generateReviewStructuredData(post, rating);
      if (reviewData) {
        items.push(reviewData);
      }
    }

    // 5. How-to structured data (for guide posts)
    const steps = extractStepsFromContent(post.content);
    if (steps.length > 0 && isHowToPost(post)) {
      const howToData = generateHowToStructuredData(post, steps);
      if (howToData) {
        items.push(howToData);
      }
    }

    // 6. Video structured data
    if (videoData) {
      const videoStructuredData = generateVideoStructuredData(post, videoData);
      if (videoStructuredData) {
        items.push(videoStructuredData);
      }
    }

    // 7. Custom structured data
    items.push(...customStructuredData);

    return items;
  }, [post, breadcrumbItems, rating, videoData, customStructuredData]);

  if (structuredDataItems.length === 0) return null;

  return (
    <>
      {structuredDataItems.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data, null, 0)
          }}
        />
      ))}
    </>
  );
}

// Helper functions to determine post type
function isReviewPost(post: BlogPost): boolean {
  const reviewIndicators = [
    '評論', '影評', '評分', '心得', 'review', 'rating',
    '好看嗎', '值得看', '推薦', '觀後感'
  ];
  
  const content = `${post.title} ${post.content} ${post.tags.join(' ')}`.toLowerCase();
  return reviewIndicators.some(indicator => content.includes(indicator.toLowerCase()));
}

function isHowToPost(post: BlogPost): boolean {
  const howToIndicators = [
    '如何', '怎麼', '教學', '步驟', '指南', '攻略',
    'how to', 'guide', 'tutorial', 'step', '方法'
  ];
  
  const content = `${post.title} ${post.content} ${post.tags.join(' ')}`.toLowerCase();
  return howToIndicators.some(indicator => content.includes(indicator.toLowerCase()));
}

// Component for Organization structured data (site-wide)
interface OrganizationStructuredDataProps {
  siteName: string;
  siteUrl: string;
  logoUrl: string;
  socialProfiles?: string[];
}

export function OrganizationStructuredData({
  siteName,
  siteUrl,
  logoUrl,
  socialProfiles = []
}: OrganizationStructuredDataProps) {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      width: 200,
      height: 60
    },
    sameAs: socialProfiles,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Chinese Traditional', 'English']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TW',
      addressLocality: '台灣'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationData, null, 0)
      }}
    />
  );
}

// Component for WebSite structured data with search functionality
interface WebSiteStructuredDataProps {
  siteName: string;
  siteUrl: string;
  searchUrl?: string;
}

export function WebSiteStructuredData({
  siteName,
  siteUrl,
  searchUrl
}: WebSiteStructuredDataProps) {
  const websiteData: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    inLanguage: 'zh-TW',
    copyrightYear: new Date().getFullYear(),
    author: {
      '@type': 'Organization',
      name: siteName
    }
  };

  // Add search functionality if search URL is provided
  if (searchUrl) {
    websiteData.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(websiteData, null, 0)
      }}
    />
  );
}

// Component for Blog structured data
interface BlogStructuredDataProps {
  siteName: string;
  siteUrl: string;
  blogUrl: string;
  description: string;
  posts?: Array<{
    title: string;
    url: string;
    datePublished: string;
    author: string;
  }>;
}

export function BlogStructuredData({
  siteName,
  siteUrl,
  blogUrl,
  description,
  posts = []
}: BlogStructuredDataProps) {
  const blogData: any = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': blogUrl,
    name: `${siteName} 電影部落格`,
    description,
    url: blogUrl,
    inLanguage: 'zh-TW',
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl
    },
    about: {
      '@type': 'Thing',
      name: '電影',
      sameAs: 'https://zh.wikipedia.org/wiki/电影'
    }
  };

  // Add blog posts if provided
  if (posts.length > 0) {
    blogData.blogPost = posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: post.url,
      datePublished: post.datePublished,
      author: {
        '@type': 'Person',
        name: post.author
      }
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(blogData, null, 0)
      }}
    />
  );
}

// High-level component that combines multiple structured data types
interface ComprehensiveStructuredDataProps {
  siteName: string;
  siteUrl: string;
  logoUrl: string;
  post?: BlogPost;
  breadcrumbItems?: Array<{ name: string; url: string }>;
  rating?: { value: number; max: number; min: number };
  videoData?: {
    embedUrl: string;
    thumbnailUrl: string;
    duration?: string;
    uploadDate?: string;
    description?: string;
  };
  socialProfiles?: string[];
}

export function ComprehensiveStructuredData({
  siteName,
  siteUrl,
  logoUrl,
  post,
  breadcrumbItems,
  rating,
  videoData,
  socialProfiles = [
    'https://www.facebook.com/moviebonus',
    'https://twitter.com/moviebonus',
    'https://line.me/ti/p/@moviebonus'
  ]
}: ComprehensiveStructuredDataProps) {
  return (
    <>
      {/* Site-wide structured data */}
      <OrganizationStructuredData
        siteName={siteName}
        siteUrl={siteUrl}
        logoUrl={logoUrl}
        socialProfiles={socialProfiles}
      />
      
      <WebSiteStructuredData
        siteName={siteName}
        siteUrl={siteUrl}
        searchUrl={`${siteUrl}/blog/search`}
      />
      
      {/* Blog-specific structured data */}
      <BlogStructuredData
        siteName={siteName}
        siteUrl={siteUrl}
        blogUrl={`${siteUrl}/blog`}
        description="台灣最完整的電影特典資訊與觀影指南部落格"
      />

      {/* Post-specific structured data */}
      {post && (
        <StructuredData
          post={post}
          breadcrumbItems={breadcrumbItems}
          rating={rating}
          videoData={videoData}
        />
      )}
    </>
  );
}