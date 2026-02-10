/**
 * BlogSearchClient Component
 * 
 * Client-side search results page with advanced filtering,
 * trending searches, and real-time suggestions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  Calendar,
  Tag,
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import BlogLayout from '@/components/blog/BlogLayout';
import PostCard from '@/components/blog/PostCard';
import { BlogPost } from '@/lib/types';
import { formatRelativeTime } from '@/lib/blog-api-client';
import { sanitizeHtml } from '@/lib/sanitize';

interface BlogSearchClientProps {
  query: string;
  results: {
    posts: BlogPost[];
    suggestions: string[];
    trending_searches: string[];
    total_results: number;
    search_time: number;
  };
  trendingSearches: string[];
  filters: {
    category?: string;
    tag?: string;
    date_from?: string;
    date_to?: string;
  };
  pagination: {
    current_page: number;
    has_more: boolean;
  };
  error?: string;
}

export default function BlogSearchClient({
  query,
  results,
  trendingSearches,
  filters,
  pagination,
  error
}: BlogSearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Generate breadcrumbs
  const breadcrumbs = [
    { label: '首頁', href: '/' },
    { label: '部落格', href: '/blog' },
    { label: '搜尋', href: '/blog/search' },
    ...(query ? [{ label: `"${query}"` }] : [])
  ];

  // Handle search submission
  const handleSearch = (newQuery?: string) => {
    const queryToUse = newQuery !== undefined ? newQuery : searchQuery;
    
    const params = new URLSearchParams();
    if (queryToUse.trim()) params.set('q', queryToUse.trim());
    
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value);
      }
    });

    router.push(`/blog/search?${params.toString()}`);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalFilters({
      category: '',
      tag: '',
      date_from: '',
      date_to: ''
    });
    
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/blog/search?${params.toString()}`);
  };

  // Generate pagination URL
  const generatePageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value);
      }
    });
    if (page > 1) params.set('page', page.toString());
    
    return `/blog/search?${params.toString()}`;
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => value && value.trim()).length;

  return (
    <BlogLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Search Header */}
        <section>
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              文章搜尋
            </h1>
            <p className="text-lg text-muted-foreground">
              搜尋電影相關文章、特典資訊與觀影指南
            </p>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder="搜尋文章標題、內容或標籤..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="pl-12 h-12 text-lg"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          handleSearch('');
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="relative">
                        <Filter className="w-4 h-4 mr-2" />
                        篩選條件
                        {activeFiltersCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {activeFiltersCount}
                          </Badge>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>

                  <Button onClick={() => handleSearch()} size="lg">
                    搜尋
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleContent>
                  <Separator className="my-6" />
                  <AdvancedFilters
                    filters={localFilters}
                    onFilterChange={handleFilterChange}
                    onApply={() => handleSearch()}
                    onClear={clearAllFilters}
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </section>

        {/* Search Results */}
        {query ? (
          <SearchResults 
            query={query}
            results={results}
            pagination={pagination}
            generatePageUrl={generatePageUrl}
            error={error}
          />
        ) : (
          <SearchHomepage 
            trendingSearches={trendingSearches}
            onTrendingClick={handleSearch}
          />
        )}
      </div>
    </BlogLayout>
  );
}

// Advanced Filters Component
function AdvancedFilters({
  filters,
  onFilterChange,
  onApply,
  onClear
}: {
  filters: any;
  onFilterChange: (key: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium mb-2">分類</label>
        <Select value={filters.category || ''} onValueChange={(value) => onFilterChange('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="選擇分類" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部分類</SelectItem>
            <SelectItem value="news">新片速報</SelectItem>
            <SelectItem value="bonus">特典情報</SelectItem>
            <SelectItem value="theater">影城導覽</SelectItem>
            <SelectItem value="review">觀影推薦</SelectItem>
            <SelectItem value="boxoffice">票房快訊</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag Filter */}
      <div>
        <label className="block text-sm font-medium mb-2">標籤</label>
        <Input
          placeholder="輸入標籤名稱"
          value={filters.tag || ''}
          onChange={(e) => onFilterChange('tag', e.target.value)}
        />
      </div>

      {/* Date From */}
      <div>
        <label className="block text-sm font-medium mb-2">開始日期</label>
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => onFilterChange('date_from', e.target.value)}
        />
      </div>

      {/* Date To */}
      <div>
        <label className="block text-sm font-medium mb-2">結束日期</label>
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => onFilterChange('date_to', e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onClear}>
          清除全部
        </Button>
        <Button onClick={onApply}>
          套用篩選
        </Button>
      </div>
    </div>
  );
}

// Search Results Component
function SearchResults({
  query,
  results,
  pagination,
  generatePageUrl,
  error
}: {
  query: string;
  results: any;
  pagination: any;
  generatePageUrl: (page: number) => string;
  error?: string;
}) {
  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-6">⚠️</div>
          <h3 className="text-xl font-semibold mb-4">搜尋發生錯誤</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            重新搜尋
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      {/* Search Results Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                搜尋結果: "{query}"
              </h2>
              <p className="text-sm text-muted-foreground">
                找到 {results.total_results} 筆結果 ({results.search_time.toFixed(3)} 秒)
              </p>
            </div>
            
            {results.suggestions.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">建議搜尋:</p>
                <div className="flex flex-wrap gap-1 justify-end">
                  {results.suggestions.slice(0, 3).map((suggestion) => (
                    <Link key={suggestion} href={`/blog/search?q=${encodeURIComponent(suggestion)}`}>
                      <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground cursor-pointer">
                        {suggestion}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results List */}
      {results.posts.length > 0 ? (
        <>
          <div className="space-y-6">
            {results.posts.map((post: BlogPost) => (
              <SearchResultItem key={post.id} post={post} query={query} />
            ))}
          </div>

          {/* Pagination */}
          {(pagination.current_page > 1 || pagination.has_more) && (
            <div className="flex items-center justify-center space-x-2 mt-12">
              {pagination.current_page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={generatePageUrl(pagination.current_page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                    上一頁
                  </Link>
                </Button>
              )}

              <span className="px-4 py-2 text-sm text-muted-foreground">
                第 {pagination.current_page} 頁
              </span>

              {pagination.has_more && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={generatePageUrl(pagination.current_page + 1)}>
                    下一頁
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <NoResultsFound query={query} />
      )}
    </section>
  );
}

// Search Result Item Component
function SearchResultItem({ post, query }: { post: BlogPost; query: string }) {
  // Highlight search terms in title and excerpt
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {post.cover_image && (
            <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                {post.category && (
                  <Badge variant="secondary" className="mb-2">
                    {post.category.name}
                  </Badge>
                )}
                <Link href={`/blog/${post.slug}`}>
                  <h3 
                    className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeHtml(highlightText(post.title, query)) 
                    }}
                  />
                </Link>
              </div>
            </div>

            {post.excerpt && (
              <p 
                className="text-muted-foreground mb-3 line-clamp-2"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(highlightText(post.excerpt, query)) 
                }}
              />
            )}

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {post.author && (
                <span>{post.author.name}</span>
              )}
              <Separator orientation="vertical" className="h-4" />
              <span>{formatRelativeTime(post.published_at || post.created_at)}</span>
              {post.reading_time && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{post.reading_time} 分鐘</span>
                  </div>
                </>
              )}
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {post.tags.slice(0, 5).map((tag) => (
                  <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// No Results Found Component
function NoResultsFound({ query }: { query: string }) {
  return (
    <Card>
      <CardContent className="text-center py-16">
        <div className="text-6xl mb-6">🔍</div>
        <h3 className="text-xl font-semibold mb-4">
          找不到「{query}」的相關結果
        </h3>
        <div className="text-muted-foreground mb-6 max-w-md mx-auto space-y-2">
          <p>請嘗試:</p>
          <ul className="text-sm space-y-1">
            <li>• 檢查拼字是否正確</li>
            <li>• 使用更簡單的關鍵字</li>
            <li>• 嘗試不同的搜尋詞彙</li>
            <li>• 使用篩選條件縮小範圍</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/blog">
              瀏覽所有文章
            </Link>
          </Button>
          <Button asChild>
            <Link href="/blog/search">
              重新搜尋
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Search Homepage Component (when no query)
function SearchHomepage({
  trendingSearches,
  onTrendingClick
}: {
  trendingSearches: string[];
  onTrendingClick: (query: string) => void;
}) {
  return (
    <section className="space-y-8">
      {/* Trending Searches */}
      {trendingSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>熱門搜尋</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {trendingSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => onTrendingClick(search)}
                  className="group"
                >
                  <Badge 
                    variant="outline" 
                    className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-sm py-2 px-4"
                  >
                    <TrendingUp className="w-3 h-3 mr-2" />
                    {search}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      <Card>
        <CardHeader>
          <CardTitle>搜尋小技巧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">搜尋語法</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 使用引號搜尋完整短語: "威秀影城"</li>
                <li>• 使用 + 要求包含特定詞彙: +Marvel</li>
                <li>• 使用 - 排除特定詞彙: 電影 -恐怖</li>
                <li>• 使用 * 作為萬用字元: 復仇者*</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">搜尋範圍</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 文章標題與內容</li>
                <li>• 文章標籤</li>
                <li>• 作者資訊</li>
                <li>• 分類描述</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}