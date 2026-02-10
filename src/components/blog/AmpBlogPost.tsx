'use client';

import { BlogPost } from '@/lib/types';
import { generateBlogPostStructuredData, optimizeMetaDescription } from '@/lib/blog-seo-utils';
import { sanitizeHtml } from '@/lib/sanitize';

interface AmpBlogPostProps {
  post: BlogPost;
  canonicalUrl: string;
}

/**
 * AMP (Accelerated Mobile Pages) Blog Post Component
 * 
 * This component renders a blog post in AMP format for improved mobile performance
 * and better Google search integration.
 */
export default function AmpBlogPost({ post, canonicalUrl }: AmpBlogPostProps) {
  const structuredData = generateBlogPostStructuredData(post);
  const optimizedDescription = optimizeMetaDescription(post.content);

  const ampHtml = `
<!doctype html>
<html ⚡ lang="zh-TW">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <title>${post.seo_title || post.title}</title>
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${optimizedDescription}">
  <meta name="keywords" content="${post.tags.join(', ')}">
  <meta name="author" content="${post.author?.name || '特典速報 パルパル'}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${post.og_title || post.title}">
  <meta property="og:description" content="${post.og_description || optimizedDescription}">
  <meta property="og:image" content="${post.cover_image || '/og-image.png'}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="特典速報 パルパル">
  <meta property="article:published_time" content="${post.published_at || post.created_at}">
  <meta property="article:modified_time" content="${post.updated_at}">
  <meta property="article:section" content="${post.category?.name || '電影'}">
  ${post.tags.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n  ')}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.twitter_title || post.title}">
  <meta name="twitter:description" content="${post.twitter_description || optimizedDescription}">
  <meta name="twitter:image" content="${post.twitter_image || post.cover_image || '/og-image.png'}">

  <!-- AMP Custom CSS -->
  <style amp-custom>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans CJK TC", "PingFang TC", sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
      background-color: #fff;
    }
    
    .header {
      border-bottom: 1px solid #eee;
      padding: 20px 0;
      margin-bottom: 30px;
    }
    
    .site-title {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      text-decoration: none;
      margin: 0;
    }
    
    .breadcrumb {
      font-size: 14px;
      color: #666;
      margin: 10px 0;
    }
    
    .breadcrumb a {
      color: #2563eb;
      text-decoration: none;
    }
    
    .article-header {
      margin-bottom: 30px;
    }
    
    .article-title {
      font-size: 32px;
      font-weight: bold;
      line-height: 1.3;
      color: #111;
      margin: 0 0 15px 0;
    }
    
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .article-excerpt {
      font-size: 18px;
      color: #555;
      font-weight: 400;
      line-height: 1.6;
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-left: 4px solid #2563eb;
      border-radius: 0 8px 8px 0;
    }
    
    .featured-image {
      margin-bottom: 30px;
      text-align: center;
    }
    
    .featured-image amp-img {
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .image-caption {
      font-size: 14px;
      color: #666;
      text-align: center;
      margin-top: 10px;
      font-style: italic;
    }
    
    .article-content {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 40px;
    }
    
    .article-content h1,
    .article-content h2,
    .article-content h3,
    .article-content h4 {
      color: #111;
      margin: 30px 0 15px 0;
      font-weight: 600;
    }
    
    .article-content h2 {
      font-size: 24px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
    }
    
    .article-content h3 {
      font-size: 20px;
    }
    
    .article-content p {
      margin: 15px 0;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 15px 0;
      padding-left: 30px;
    }
    
    .article-content li {
      margin: 8px 0;
    }
    
    .article-content blockquote {
      border-left: 4px solid #e5e7eb;
      margin: 20px 0;
      padding: 15px 20px;
      background-color: #f9fafb;
      font-style: italic;
      color: #555;
    }
    
    .article-content code {
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "Courier New", monospace;
      font-size: 14px;
    }
    
    .article-content pre {
      background-color: #1f2937;
      color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 20px 0;
    }
    
    .article-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    
    .tags {
      margin: 30px 0;
      padding: 20px 0;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
    }
    
    .tags-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #374151;
    }
    
    .tag {
      display: inline-block;
      background-color: #e5e7eb;
      color: #374151;
      padding: 4px 12px;
      margin: 2px 5px 2px 0;
      border-radius: 16px;
      font-size: 14px;
      text-decoration: none;
    }
    
    .tag:hover {
      background-color: #d1d5db;
    }
    
    .movie-info {
      background-color: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    
    .movie-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .movie-details {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
    }
    
    .related-posts {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 25px;
      margin: 40px 0;
    }
    
    .related-posts-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #111;
    }
    
    .related-post-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .related-post-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .related-post-title {
      font-size: 16px;
      font-weight: 500;
      color: #2563eb;
      text-decoration: none;
      line-height: 1.4;
    }
    
    .related-post-excerpt {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    
    .footer {
      margin-top: 60px;
      padding: 30px 0;
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    
    /* Mobile optimizations */
    @media (max-width: 640px) {
      body {
        padding: 0 15px;
      }
      
      .article-title {
        font-size: 28px;
      }
      
      .article-content h2 {
        font-size: 22px;
      }
      
      .article-meta {
        flex-direction: column;
        gap: 10px;
      }
    }
  </style>
  
  <!-- AMP Boilerplate -->
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 0)}
  </script>
</head>

<body>
  <header class="header">
    <h1 class="site-title">
      <a href="/">特典速報 パルパル</a>
    </h1>
    <nav class="breadcrumb">
      <a href="/">首頁</a> › 
      <a href="/blog">部落格</a> › 
      ${post.category ? `<a href="/blog/category/${post.category.slug}">${post.category.name}</a> › ` : ''}
      ${post.title}
    </nav>
  </header>

  <main>
    <article>
      <header class="article-header">
        <h1 class="article-title">${post.title}</h1>
        
        <div class="article-meta">
          ${post.author ? `
          <div class="meta-item">
            <span>作者：${post.author.name}</span>
          </div>` : ''}
          
          <div class="meta-item">
            <span>發布時間：${new Date(post.published_at || post.created_at).toLocaleDateString('zh-TW')}</span>
          </div>
          
          <div class="meta-item">
            <span>閱讀時間：${post.reading_time || 5} 分鐘</span>
          </div>
          
          <div class="meta-item">
            <span>瀏覽次數：${post.view_count}</span>
          </div>
        </div>
        
        ${post.excerpt ? `
        <div class="article-excerpt">
          ${post.excerpt}
        </div>` : ''}
      </header>

      ${post.cover_image ? `
      <figure class="featured-image">
        <amp-img
          src="${post.cover_image}"
          alt="${post.title} - 特典速報"
          width="800"
          height="450"
          layout="responsive">
        </amp-img>
        <figcaption class="image-caption">${post.title}</figcaption>
      </figure>` : ''}

      ${post.primary_movie ? `
      <div class="movie-info">
        <div class="movie-title">${post.primary_movie.title}</div>
        <div class="movie-details">
          ${post.primary_movie.english_title ? `英文標題：${post.primary_movie.english_title}<br>` : ''}
          ${post.primary_movie.director?.length ? `導演：${post.primary_movie.director.join(', ')}<br>` : ''}
          ${post.primary_movie.genre?.length ? `類型：${post.primary_movie.genre.join(', ')}<br>` : ''}
          ${post.primary_movie.release_date ? `上映日期：${new Date(post.primary_movie.release_date).toLocaleDateString('zh-TW')}` : ''}
        </div>
      </div>` : ''}

      <div class="article-content">
        ${post.content.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, (match, src) => {
          // Convert regular img tags to amp-img
          return `<amp-img src="${src}" alt="${post.title}" width="800" height="450" layout="responsive"></amp-img>`;
        }).replace(/<script[^>]*>.*?<\/script>/gs, '')} <!-- Remove any script tags -->
      </div>

      ${post.tags.length > 0 ? `
      <div class="tags">
        <div class="tags-title">標籤</div>
        ${post.tags.map(tag => `<a href="/blog/tag/${encodeURIComponent(tag)}" class="tag">#${tag}</a>`).join('')}
      </div>` : ''}
    </article>

    <!-- Related Posts Section -->
    <section class="related-posts">
      <h2 class="related-posts-title">相關文章</h2>
      <div id="related-posts-container">
        <!-- Related posts will be populated by AMP -->
      </div>
    </section>
  </main>

  <footer class="footer">
    <p>© ${new Date().getFullYear()} <a href="/">特典速報 パルパル</a>. 版權所有。</p>
    <p><a href="/privacy">隱私權政策</a> | <a href="/terms">使用條款</a></p>
  </footer>

  <!-- AMP Analytics (Google Analytics) -->
  <amp-analytics type="gtag" data-credentials="include">
    <script type="application/json">
    {
      "vars": {
        "gtag_id": "${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'}",
        "config": {
          "${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'}": {
            "groups": "default"
          }
        }
      }
    }
    </script>
  </amp-analytics>
</body>
</html>`;

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(ampHtml) }} />
  );
}

/**
 * Hook for generating AMP-specific optimizations
 */
export function useAmpOptimizations(post: BlogPost) {
  // Optimize images for AMP
  const optimizeImagesForAmp = (content: string) => {
    return content.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/g,
      (match, before, src, after) => {
        // Extract width and height if available
        const widthMatch = match.match(/width="(\d+)"/);
        const heightMatch = match.match(/height="(\d+)"/);
        const altMatch = match.match(/alt="([^"]*)"/);
        
        const width = widthMatch ? widthMatch[1] : '800';
        const height = heightMatch ? heightMatch[1] : '450';
        const alt = altMatch ? altMatch[1] : post.title;
        
        return `<amp-img src="${src}" alt="${alt}" width="${width}" height="${height}" layout="responsive"></amp-img>`;
      }
    );
  };

  // Remove unsupported elements for AMP
  const removeUnsupportedElements = (content: string) => {
    return content
      .replace(/<script[^>]*>.*?<\/script>/gs, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gs, '') // Remove iframes (need amp-iframe)
      .replace(/style="[^"]*"/g, '') // Remove inline styles
      .replace(/<form[^>]*>.*?<\/form>/gs, ''); // Remove forms (need amp-form)
  };

  // Optimize content for AMP
  const optimizedContent = removeUnsupportedElements(optimizeImagesForAmp(post.content));

  return {
    optimizedContent,
    optimizeImagesForAmp,
    removeUnsupportedElements
  };
}