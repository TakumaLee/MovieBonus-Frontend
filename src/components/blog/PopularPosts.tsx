// @ts-nocheck
/**
 * PopularPosts Component
 * 
 * Sidebar widget displaying popular blog posts with views count,
 * optimized for Taiwan market preferences
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, TrendingUp, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PopularPost } from '@/lib/types';
import { fetchPopularPosts } from '@/lib/blog-api-client';
import { formatRelativeTime } from '@/lib/blog-api-client';

interface PopularPostsProps {
  timeframe?: 'week' | 'month' | 'year' | 'all';
  limit?: number;
  showTabs?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export default function PopularPosts({
  timeframe = 'month',
  limit = 10,
  showTabs = true,
  variant = 'default',
  className = ''
}: PopularPostsProps) {
  const [posts, setPosts] = useState<Record<string, PopularPost[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(timeframe);
  const [error, setError] = useState<string | null>(null);

  const timeframes = [
    { key: 'week', label: '本週', icon: Calendar },
    { key: 'month', label: '本月', icon: TrendingUp },
    { key: 'year', label: '今年', icon: Clock },
  ] as const;

  // Fetch popular posts for different timeframes
  useEffect(() => {
    const loadPopularPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        if (showTabs) {
          // Load all timeframes for tabs
          const promises = timeframes.map(async ({ key }) => {
            const response = await fetchPopularPosts(key, limit);
            return { timeframe: key, posts: response.success ? response.data || [] : [] };
          });

          const results = await Promise.all(promises);
          const postsMap = results.reduce((acc, { timeframe, posts }) => {
            acc[timeframe] = posts;
            return acc;
          }, {} as Record<string, PopularPost[]>);

          setPosts(postsMap);
        } else {
          // Load single timeframe
          const response = await fetchPopularPosts(timeframe, limit);
          if (response.success) {
            setPosts({ [timeframe]: response.data || [] });
          } else {
            setError('無法載入熱門文章');
          }
        }
      } catch (err) {
        setError('載入失敗，請稍後再試');
        console.error('Error loading popular posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPopularPosts();
  }, [timeframe, limit, showTabs]);

  if (loading) {
    return <PopularPostsSkeleton variant={variant} showTabs={showTabs} />;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>熱門文章</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPosts = posts[activeTab] || [];

  if (currentPosts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>熱門文章</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>暫無熱門文章</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>熱門文章</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {showTabs ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {timeframes.map(({ key, label }) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {timeframes.map(({ key }) => (
              <TabsContent key={key} value={key} className="mt-0">
                <PopularPostsList 
                  posts={posts[key] || []} 
                  variant={variant}
                  showRanking={true}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <PopularPostsList 
            posts={currentPosts} 
            variant={variant}
            showRanking={true}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Popular Posts List Component
function PopularPostsList({ 
  posts, 
  variant, 
  showRanking = true 
}: { 
  posts: PopularPost[]; 
  variant: string;
  showRanking?: boolean;
}) {
  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <PopularPostItem 
          key={post.id} 
          post={post} 
          rank={showRanking ? index + 1 : undefined}
          variant={variant}
        />
      ))}
    </div>
  );
}

// Individual Popular Post Item
function PopularPostItem({ 
  post, 
  rank, 
  variant 
}: { 
  post: PopularPost; 
  rank?: number; 
  variant: string; 
}) {
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Link href={`/blog/${post.slug}`}>
      <div className={`group flex items-start space-x-3 p-3 -m-3 rounded-lg hover:bg-muted/50 transition-colors ${
        variant === 'minimal' ? 'hover:bg-muted/30' : ''
      }`}>
        {/* Ranking Badge */}
        {rank && (
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            getRankBadgeColor(rank)
          }`}>
            {rank}
          </div>
        )}

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium leading-tight group-hover:text-primary transition-colors ${
            variant === 'compact' ? 'text-sm' : 'text-sm'
          } line-clamp-2`}>
            {post.title}
          </h4>
          
          <div className="flex items-center space-x-3 mt-2">
            {/* Views Count */}
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{formatViewCount(post.view_count)}</span>
            </div>
            
            {/* Publish Date */}
            <div className="text-xs text-muted-foreground">
              {formatRelativeTime(post.published_at)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Loading Skeleton
function PopularPostsSkeleton({ 
  variant, 
  showTabs 
}: { 
  variant: string; 
  showTabs: boolean; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>熱門文章</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {showTabs && (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {Array(8).fill(0).map((_, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex space-x-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Utility Functions
function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// Compact variant for smaller spaces
export function PopularPostsCompact({ 
  limit = 5, 
  className = '' 
}: { 
  limit?: number; 
  className?: string; 
}) {
  return (
    <PopularPosts
      timeframe="month"
      limit={limit}
      showTabs={false}
      variant="compact"
      className={className}
    />
  );
}

// Minimal variant for sidebars
export function PopularPostsMinimal({ 
  limit = 3, 
  className = '' 
}: { 
  limit?: number; 
  className?: string; 
}) {
  return (
    <div className={className}>
      <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wide">
        熱門文章
      </h3>
      <PopularPosts
        timeframe="week"
        limit={limit}
        showTabs={false}
        variant="minimal"
        className="border-none shadow-none"
      />
    </div>
  );
}