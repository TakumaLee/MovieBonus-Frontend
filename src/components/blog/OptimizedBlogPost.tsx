// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { BlogPost, RelatedPost } from '@/lib/types';
import { sanitizeHtml } from '@/lib/sanitize';
import { ComprehensiveStructuredData } from './StructuredData';
import { BlogLinkBuilder, BlogSEOClient, injectInternalLinks } from '@/lib/blog-link-builder';
import { ImageSEOOptimizer, generateImageSEOReport } from '@/lib/image-seo-optimizer';
import { generateBreadcrumbStructuredData } from '@/lib/blog-seo-utils';

interface OptimizedBlogPostProps {
  post: BlogPost;
  relatedPosts?: RelatedPost[];
}

/**
 * Optimized Blog Post Component with advanced SEO features
 */
export default function OptimizedBlogPost({ post, relatedPosts = [] }: OptimizedBlogPostProps) {
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([]);
  const [optimizedContent, setOptimizedContent] = useState(post.content);
  const [isClient, setIsClient] = useState(false);

  // SEO clients and optimizers
  const seoClient = new BlogSEOClient();
  const linkBuilder = new BlogLinkBuilder({
    maxLinksPerPost: 8,
    minRelevanceScore: 0.4,
    avoidOverLinking: true
  });
  const imageOptimizer = new ImageSEOOptimizer();

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: '首頁', url: '/' },
    { name: '部落格', url: '/blog' },
    ...(post.category ? [{ name: post.category.name, url: `/blog/category/${post.category.slug}` }] : []),
    { name: post.title, url: `/blog/${post.slug}` }
  ];

  useEffect(() => {
    setIsClient(true);
    
    // Load internal links and optimize content
    async function optimizePost() {
      try {
        // Fetch internal link suggestions
        const links = await seoClient.getInternalLinks(post.slug, 10);
        setInternalLinks(links);

        // Generate internal links automatically
        const generatedLinks = await linkBuilder.generateInternalLinks(
          post,
          relatedPosts,
          [] // Movies would be fetched from API
        );

        // Combine API links with generated links
        const allLinks = [...links, ...generatedLinks]
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, 8); // Limit total links

        // Inject internal links into content
        const contentWithLinks = injectInternalLinks(post.content, allLinks);
        setOptimizedContent(contentWithLinks);

        // Generate image SEO report for analytics
        const imageReport = generateImageSEOReport(post);
        console.log('Image SEO Score:', imageReport.seoScore);

      } catch (error) {
        console.error('Error optimizing post:', error);
      }
    }

    optimizePost();
  }, [post.slug]);

  // Don't render on server to avoid hydration mismatch
  if (!isClient) {
    return (
      <article className="blog-post">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
      </article>
    );
  }

  return (
    <>
      {/* Comprehensive Structured Data */}
      <ComprehensiveStructuredData
        siteName="特典速報 パルパル"
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL || 'https://paruparu.vercel.app'}
        logoUrl="/logo.png"
        post={post}
        breadcrumbItems={breadcrumbItems}
        socialProfiles={[
          'https://www.facebook.com/moviebonus',
          'https://twitter.com/moviebonus',
          'https://line.me/ti/p/@moviebonus'
        ]}
      />

      <article className="blog-post max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb mb-6 text-sm text-gray-600" aria-label="麵包屑導航">
          {breadcrumbItems.map((item, index) => (
            <span key={index}>
              {index > 0 && <span className="mx-2">›</span>}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-gray-900 font-medium">{item.name}</span>
              ) : (
                <a 
                  href={item.url} 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {item.name}
                </a>
              )}
            </span>
          ))}
        </nav>

        {/* Article Header */}
        <header className="article-header mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <div className="text-xl text-gray-700 mb-6 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              {post.excerpt}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 pb-6 border-b border-gray-200">
            {post.author && (
              <div className="flex items-center gap-2">
                <span className="font-medium">作者：</span>
                <span>{post.author.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="font-medium">發布時間：</span>
              <time dateTime={post.published_at || post.created_at}>
                {new Date(post.published_at || post.created_at).toLocaleDateString('zh-TW')}
              </time>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">閱讀時間：</span>
              <span>{post.reading_time || 5} 分鐘</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">瀏覽次數：</span>
              <span>{post.view_count.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* Featured Image with optimized SEO */}
        {post.cover_image && (
          <figure className="featured-image mb-10">
            <div className="relative overflow-hidden rounded-lg shadow-lg">
              <img
                src={post.cover_image}
                alt={imageOptimizer.generateAltText(post.cover_image, {
                  post,
                  isFeatureImage: true
                })}
                className="w-full h-auto object-cover"
                loading="eager"
                width="800"
                height="450"
              />
            </div>
            <figcaption className="text-center text-sm text-gray-600 mt-3 italic">
              {post.title} - 特色圖片
            </figcaption>
          </figure>
        )}

        {/* Movie Information Card */}
        {post.primary_movie && (
          <div className="movie-info bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4">相關電影資訊</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">{post.primary_movie.title}</h4>
                {post.primary_movie.english_title && (
                  <p className="text-blue-700 mb-2">{post.primary_movie.english_title}</p>
                )}
                {post.primary_movie.director?.length > 0 && (
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">導演：</span>
                    {post.primary_movie.director.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-sm text-blue-600 space-y-1">
                {post.primary_movie.genre?.length > 0 && (
                  <p>
                    <span className="font-medium">類型：</span>
                    {post.primary_movie.genre.join(', ')}
                  </p>
                )}
                {post.primary_movie.release_date && (
                  <p>
                    <span className="font-medium">上映日期：</span>
                    {new Date(post.primary_movie.release_date).toLocaleDateString('zh-TW')}
                  </p>
                )}
                <a 
                  href={`/movie/${post.primary_movie.id}`}
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  查看電影詳情
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Optimized Article Content with Internal Links */}
        <div 
          className="article-content prose prose-lg max-w-none
            prose-headings:text-gray-900 prose-headings:font-bold
            prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-blue-500 prose-h2:pb-2
            prose-h3:text-xl prose-h4:text-lg
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:bg-gray-50 prose-blockquote:px-6 prose-blockquote:py-4
            prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-ul:my-6 prose-ol:my-6
            prose-li:my-2
            prose-img:rounded-lg prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(optimizedContent) }}
        />

        {/* Tags Section */}
        {post.tags.length > 0 && (
          <div className="tags mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">標籤</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <a
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="related-posts mt-12 p-8 bg-gray-50 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">相關文章</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 3).map(relatedPost => (
                <article key={relatedPost.id} className="bg-white rounded-lg shadow-sm p-6">
                  {relatedPost.cover_image && (
                    <img
                      src={relatedPost.cover_image}
                      alt={relatedPost.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                      loading="lazy"
                    />
                  )}
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    <a 
                      href={`/blog/${relatedPost.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {relatedPost.title}
                    </a>
                  </h4>
                  {relatedPost.excerpt && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {relatedPost.excerpt}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{relatedPost.category.name}</span>
                    <span>{relatedPost.reading_time} 分鐘</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Internal Links Summary (for debugging in development) */}
        {process.env.NODE_ENV === 'development' && internalLinks.length > 0 && (
          <details className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <summary className="cursor-pointer font-medium text-yellow-800">
              SEO 內部連結 ({internalLinks.length})
            </summary>
            <div className="mt-4 space-y-2">
              {internalLinks.map((link, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{link.type}:</span> 
                  <a href={link.url} className="text-blue-600 mx-2">
                    {link.anchor_text}
                  </a>
                  <span className="text-gray-500">
                    (relevance: {(link.relevance_score * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </article>

      {/* AMP Version Link */}
      <link 
        rel="amphtml" 
        href={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}/amp`} 
      />
      
      {/* Preload related posts for performance */}
      {relatedPosts.slice(0, 2).map(relatedPost => (
        <link
          key={relatedPost.id}
          rel="prefetch"
          href={`/blog/${relatedPost.slug}`}
        />
      ))}
    </>
  );
}