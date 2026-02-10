/**
 * BlogPostClient Component
 * 
 * Client-side individual blog post with reading progress,
 * social sharing, table of contents, and related posts
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BlogLayout from '@/components/blog/BlogLayout';
import PostContent from '@/components/blog/PostContent';
import ReadingProgressIndicator from '@/components/blog/ReadingProgress';
import TableOfContents from '@/components/blog/TableOfContents';
import { FloatingShareButtons, MobileShareBar } from '@/components/blog/ShareButtons';
import PostCard from '@/components/blog/PostCard';
import { BlogPost, RelatedPost } from '@/lib/types';
import { trackPostView } from '@/lib/blog-api-client';
import { sanitizeJsonLd } from '@/lib/sanitize';

interface BlogPostClientProps {
  post: BlogPost;
  relatedPosts: RelatedPost[];
  structuredData?: any;
}

export default function BlogPostClient({
  post,
  relatedPosts,
  structuredData
}: BlogPostClientProps) {
  const articleRef = useRef<HTMLElement>(null);

  // Track post view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await trackPostView(post.id, {
          page_url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Failed to track post view:', error);
      }
    };

    trackView();
  }, [post.id]);

  // Generate breadcrumbs
  const breadcrumbs = [
    { label: '首頁', href: '/' },
    { label: '部落格', href: '/blog' }
  ];

  if (post.category) {
    breadcrumbs.push({
      label: post.category.name,
      href: `/blog/category/${post.category.slug}`
    });
  }

  breadcrumbs.push({
    label: post.title,
    href: `/blog/${post.slug}`
  });

  // Share data
  const shareData = {
    url: typeof window !== 'undefined' ? window.location.href : '',
    title: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.cover_image,
    hashtags: post.tags
  };

  return (
    <>
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: sanitizeJsonLd(structuredData)
          }}
        />
      )}

      <BlogLayout breadcrumbs={breadcrumbs}>
        <div className="relative">
          {/* Reading Progress */}
          <ReadingProgressIndicator
            articleRef={articleRef}
            postId={post.id}
            showPercentage={true}
            showTimeEstimate={true}
            position="top"
            variant="bar"
          />

          {/* Main Content Grid */}
          <div className="grid xl:grid-cols-4 gap-8">
            {/* Table of Contents - Desktop Sidebar */}
            <div className="hidden xl:block">
              <TableOfContents
                articleRef={articleRef}
                variant="sidebar"
                showProgress={true}
                className="w-full max-w-xs"
              />
            </div>

            {/* Article Content */}
            <article 
              ref={articleRef}
              className="xl:col-span-2 max-w-none"
            >
              <PostContent 
                post={post}
                onContentLoad={() => {
                  // Content loaded callback for analytics
                }}
              />

              {/* Mobile Table of Contents */}
              <div className="xl:hidden mb-8">
                <TableOfContents
                  articleRef={articleRef}
                  variant="mobile"
                  showProgress={true}
                />
              </div>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <section className="mt-16">
                  <h3 className="text-2xl font-bold mb-6">相關文章</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedPosts.map((relatedPost) => (
                      <PostCard
                        key={relatedPost.id}
                        post={relatedPost as any}
                        variant="compact"
                        showImage={true}
                        showExcerpt={false}
                        showMeta={true}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Comments Section (Placeholder) */}
              <section className="mt-16">
                <CommentsSection postId={post.id} />
              </section>
            </article>

            {/* Right Sidebar */}
            <aside className="xl:col-span-1 space-y-6">
              {/* Author Info */}
              {post.author && (
                <AuthorInfoCard author={post.author} />
              )}

              {/* Post Tags */}
              {post.tags.length > 0 && (
                <TagsCard tags={post.tags} />
              )}

              {/* Category Posts */}
              {post.category && (
                <CategoryPostsCard category={post.category} />
              )}
            </aside>
          </div>

          {/* Floating Social Share - Desktop */}
          <FloatingShareButtons 
            data={shareData} 
            postId={post.id}
            className="hidden lg:block"
          />

          {/* Mobile Share Bar */}
          <MobileShareBar 
            data={shareData} 
            postId={post.id}
            className="lg:hidden"
          />
        </div>
      </BlogLayout>
    </>
  );
}

// Author Info Card Component
function AuthorInfoCard({ author }: { author: any }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold">
            {author.name.charAt(0)}
          </span>
        </div>
        <CardTitle className="text-lg">{author.name}</CardTitle>
      </CardHeader>
      
      {author.bio && (
        <CardContent>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {author.bio}
          </p>
          
          {author.social_links && (
            <div className="flex justify-center space-x-4 mt-4">
              {author.social_links.line && (
                <a 
                  href={author.social_links.line}
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LINE
                </a>
              )}
              {author.social_links.facebook && (
                <a 
                  href={author.social_links.facebook}
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Tags Card Component
function TagsCard({ tags }: { tags: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">文章標籤</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/blog/tag/${encodeURIComponent(tag)}`}
              className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
            >
              #{tag}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Category Posts Card Component
function CategoryPostsCard({ category }: { category: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">更多 {category.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            探索更多關於 {category.name} 的文章
          </p>
          <a
            href={`/blog/category/${category.slug}`}
            className="block w-full text-center py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            查看所有文章
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// Comments Section Component (Placeholder)
function CommentsSection({ postId }: { postId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">讀者留言</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">留言功能即將推出</p>
          <p className="text-sm">
            目前可以透過社交媒體分享您的想法
          </p>
        </div>
      </CardContent>
    </Card>
  );
}