// @ts-nocheck
/**
 * CategoryNav Component
 * 
 * Blog category navigation with icons, post counts,
 * and responsive design for Taiwan market
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Film, 
  Gift, 
  MapPin, 
  Star, 
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogCategory } from '@/lib/types';
import { fetchBlogCategories } from '@/lib/blog-api-client';

interface CategoryNavProps {
  categories?: BlogCategory[];
  variant?: 'grid' | 'horizontal' | 'vertical';
  showCounts?: boolean;
  className?: string;
}

// Category icon mapping
const categoryIcons = {
  news: Film,
  bonus: Gift,
  theater: MapPin,
  review: Star,
  boxoffice: TrendingUp,
} as const;

// Category colors for Taiwan market
const categoryColors = {
  news: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
  bonus: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
  theater: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
  review: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
  boxoffice: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
} as const;

export default function CategoryNav({ 
  categories: providedCategories,
  variant = 'grid',
  showCounts = true,
  className = ''
}: CategoryNavProps) {
  const [categories, setCategories] = useState<BlogCategory[]>(providedCategories || []);
  const [loading, setLoading] = useState(!providedCategories);
  const [scrollPosition, setScrollPosition] = useState(0);
  const pathname = usePathname();

  // Fetch categories if not provided
  useEffect(() => {
    if (!providedCategories) {
      fetchBlogCategories()
        .then(response => {
          if (response.success && response.data) {
            setCategories(response.data.filter(cat => cat.is_active));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [providedCategories]);

  if (loading) {
    return <CategoryNavSkeleton variant={variant} />;
  }

  if (categories.length === 0) {
    return null;
  }

  // Filter and sort categories
  const activeCategories = categories
    .filter(cat => cat.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className={className}>
      {variant === 'grid' && (
        <CategoryGrid 
          categories={activeCategories} 
          showCounts={showCounts} 
          currentPath={pathname}
        />
      )}
      
      {variant === 'horizontal' && (
        <CategoryHorizontal 
          categories={activeCategories} 
          showCounts={showCounts}
          currentPath={pathname}
          scrollPosition={scrollPosition}
          onScrollChange={setScrollPosition}
        />
      )}
      
      {variant === 'vertical' && (
        <CategoryVertical 
          categories={activeCategories} 
          showCounts={showCounts}
          currentPath={pathname}
        />
      )}
    </div>
  );
}

// Grid Layout (Desktop/Tablet)
function CategoryGrid({ 
  categories, 
  showCounts, 
  currentPath 
}: { 
  categories: BlogCategory[]; 
  showCounts: boolean; 
  currentPath: string; 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((category) => (
        <CategoryCard 
          key={category.id} 
          category={category} 
          showCount={showCounts}
          isActive={currentPath.includes(`/blog/category/${category.slug}`)}
        />
      ))}
    </div>
  );
}

// Horizontal Scrollable Layout (Mobile)
function CategoryHorizontal({ 
  categories, 
  showCounts, 
  currentPath,
  scrollPosition,
  onScrollChange
}: { 
  categories: BlogCategory[]; 
  showCounts: boolean; 
  currentPath: string;
  scrollPosition: number;
  onScrollChange: (position: number) => void;
}) {
  const scrollContainer = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainer.current) return;
    
    const scrollAmount = 200;
    const newPosition = direction === 'left' 
      ? scrollPosition - scrollAmount 
      : scrollPosition + scrollAmount;
    
    scrollContainer.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    
    onScrollChange(newPosition);
  };

  return (
    <div className="relative">
      {/* Scroll Controls */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll('left')}
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll('right')}
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable Categories */}
      <ScrollArea className="mx-8">
        <div 
          ref={scrollContainer}
          className="flex space-x-4 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {categories.map((category) => (
            <div key={category.id} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
              <CategoryCard 
                category={category} 
                showCount={showCounts}
                isActive={currentPath.includes(`/blog/category/${category.slug}`)}
                compact
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Vertical Sidebar Layout
function CategoryVertical({ 
  categories, 
  showCounts, 
  currentPath 
}: { 
  categories: BlogCategory[]; 
  showCounts: boolean; 
  currentPath: string; 
}) {
  return (
    <nav className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wide">
        文章分類
      </h3>
      {categories.map((category) => (
        <Link 
          key={category.id} 
          href={`/blog/category/${category.slug}`}
          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
            currentPath.includes(`/blog/category/${category.slug}`)
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <div className="flex items-center space-x-3">
            {getCategoryIcon(category.slug)}
            <span className="font-medium">{category.name}</span>
          </div>
          {showCounts && category.post_count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {category.post_count}
            </Badge>
          )}
        </Link>
      ))}
    </nav>
  );
}

// Individual Category Card
function CategoryCard({ 
  category, 
  showCount, 
  isActive, 
  compact = false 
}: { 
  category: BlogCategory; 
  showCount: boolean; 
  isActive: boolean; 
  compact?: boolean; 
}) {
  const Icon = getCategoryIcon(category.slug);
  const colorClass = getCategoryColor(category.slug);

  return (
    <Link href={`/blog/category/${category.slug}`}>
      <Card className={`h-full transition-all duration-300 hover:scale-105 cursor-pointer ${
        isActive ? 'ring-2 ring-primary' : ''
      } ${colorClass}`}>
        <CardContent className={`${compact ? 'p-4' : 'p-6'} text-center`}>
          <div className="flex flex-col items-center space-y-3">
            <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} flex items-center justify-center`}>
              <Icon className={`${compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </div>
            
            <div>
              <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
                {category.name}
              </h3>
              
              {category.description && !compact && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
            
            {showCount && category.post_count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {category.post_count} 篇
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Loading Skeleton
function CategoryNavSkeleton({ variant }: { variant: 'grid' | 'horizontal' | 'vertical' }) {
  if (variant === 'vertical') {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-20 mb-4" />
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const gridClass = variant === 'grid' 
    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'
    : 'flex space-x-4 overflow-x-hidden';

  return (
    <div className={gridClass}>
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <Skeleton className="w-12 h-12" />
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

// Helper Functions
function getCategoryIcon(slug: string) {
  return categoryIcons[slug as keyof typeof categoryIcons] || Film;
}

function getCategoryColor(slug: string) {
  return categoryColors[slug as keyof typeof categoryColors] || 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100';
}