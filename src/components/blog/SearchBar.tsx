// @ts-nocheck
/**
 * SearchBar Component
 * 
 * Advanced blog search with suggestions, filters,
 * and optimized UX for Taiwan market
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  X, 
  Filter, 
  Calendar,
  Tag,
  TrendingUp,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { 
  fetchSearchSuggestions, 
  fetchTrendingSearches,
  fetchBlogCategories 
} from '@/lib/blog-api-client';
import { BlogCategory } from '@/lib/types';
import { useDebounce } from '@/hooks';

interface SearchBarProps {
  placeholder?: string;
  variant?: 'default' | 'compact' | 'hero';
  showFilters?: boolean;
  showSuggestions?: boolean;
  showTrending?: boolean;
  className?: string;
  onSearchChange?: (query: string) => void;
}

interface SearchFilters {
  category?: string;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function SearchBar({
  placeholder = '搜尋電影文章、特典資訊...',
  variant = 'default',
  showFilters = true,
  showSuggestions = true,
  showTrending = true,
  className = '',
  onSearchChange
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    dateFrom: searchParams.get('date_from') || '',
    dateTo: searchParams.get('date_to') || ''
  });
  
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Debounced query for suggestions
  const debouncedQuery = useDebounce(query, 300);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [trendingResult, categoriesResult] = await Promise.all([
          showTrending ? fetchTrendingSearches() : Promise.resolve({ success: false }),
          fetchBlogCategories()
        ]);

        if (trendingResult.success && trendingResult.data) {
          setTrendingSearches(trendingResult.data);
        }

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data.filter(cat => cat.is_active));
        }
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    };

    loadInitialData();
  }, [showTrending]);

  // Load suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2 && showSuggestions) {
      setLoading(true);
      fetchSearchSuggestions(debouncedQuery)
        .then(response => {
          if (response.success && response.data) {
            setSuggestions(response.data);
          }
        })
        .catch(error => console.error('Error fetching suggestions:', error))
        .finally(() => setLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, showSuggestions]);

  // Count active filters
  useEffect(() => {
    const count = Object.values(filters).filter(value => value && value.trim()).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    const params = new URLSearchParams();
    params.set('q', searchQuery.trim());

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value);
      }
    });

    router.push(`/blog/search?${params.toString()}`);
    setShowSuggestionsDropdown(false);
    onSearchChange?.(searchQuery);
  }, [query, filters, router, onSearchChange]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.trim().length >= 2) {
      setShowSuggestionsDropdown(true);
    } else {
      setShowSuggestionsDropdown(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      category: '',
      tag: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setShowSuggestionsDropdown(false);
    inputRef.current?.focus();
  };

  const inputSizeClass = {
    default: 'h-12',
    compact: 'h-10',
    hero: 'h-16 text-lg'
  }[variant];

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
            variant === 'hero' ? 'w-6 h-6' : 'w-5 h-5'
          }`} />
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              } else if (e.key === 'Escape') {
                setShowSuggestionsDropdown(false);
              }
            }}
            className={`${inputSizeClass} pl-12 pr-20 ${
              variant === 'hero' ? 'text-lg' : ''
            }`}
            onFocus={() => {
              if (query.trim().length >= 2 || trendingSearches.length > 0) {
                setShowSuggestionsDropdown(true);
              }
            }}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* Clear Button */}
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-8 w-8 p-0 hover:bg-transparent"
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {/* Filters Button */}
            {showFilters && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 relative"
                  >
                    <Filter className="w-4 h-4" />
                    {activeFiltersCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <SearchFilters
                    filters={filters}
                    categories={categories}
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Search Button */}
            <Button 
              onClick={() => handleSearch()}
              size="sm"
              className="h-8"
            >
              搜尋
            </Button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestionsDropdown && (showSuggestions || showTrending) && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto">
            <CardContent className="p-4">
              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">搜尋建議</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              {showTrending && trendingSearches.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">熱門搜尋</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.slice(0, 8).map((trend, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleSuggestionClick(trend)}
                      >
                        {trend}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* No suggestions */}
              {query.trim().length >= 2 && suggestions.length === 0 && !loading && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  沒有找到相關建議
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.category && (
            <ActiveFilterBadge
              label={`分類: ${categories.find(cat => cat.slug === filters.category)?.name || filters.category}`}
              onRemove={() => handleFilterChange('category', '')}
            />
          )}
          {filters.tag && (
            <ActiveFilterBadge
              label={`標籤: ${filters.tag}`}
              onRemove={() => handleFilterChange('tag', '')}
            />
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <ActiveFilterBadge
              label={`日期: ${filters.dateFrom || '開始'} ~ ${filters.dateTo || '結束'}`}
              onRemove={() => {
                handleFilterChange('dateFrom', '');
                handleFilterChange('dateTo', '');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Search Filters Component
function SearchFilters({
  filters,
  categories,
  onFilterChange,
  onClear
}: {
  filters: SearchFilters;
  categories: BlogCategory[];
  onFilterChange: (key: keyof SearchFilters, value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">篩選條件</h4>
        <Button variant="ghost" size="sm" onClick={onClear}>
          清除全部
        </Button>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">分類</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {filters.category 
                ? categories.find(cat => cat.slug === filters.category)?.name || '請選擇分類'
                : '請選擇分類'
              }
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => onFilterChange('category', '')}>
              全部分類
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => onFilterChange('category', category.slug)}
              >
                {category.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tag Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">標籤</label>
        <Input
          placeholder="輸入標籤名稱"
          value={filters.tag || ''}
          onChange={(e) => onFilterChange('tag', e.target.value)}
        />
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">發布日期</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            placeholder="開始日期"
            value={filters.dateFrom || ''}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          />
          <Input
            type="date"
            placeholder="結束日期"
            value={filters.dateTo || ''}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// Active Filter Badge
function ActiveFilterBadge({
  label,
  onRemove
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="secondary" className="flex items-center space-x-1">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}

// Compact variant for headers
export function SearchBarCompact({ className = '' }: { className?: string }) {
  return (
    <SearchBar
      variant="compact"
      showFilters={false}
      showTrending={false}
      placeholder="搜尋文章..."
      className={className}
    />
  );
}

// Hero variant for homepage
export function SearchBarHero({ className = '' }: { className?: string }) {
  return (
    <SearchBar
      variant="hero"
      showFilters={true}
      showSuggestions={true}
      showTrending={true}
      placeholder="探索電影文章、特典資訊與觀影指南..."
      className={className}
    />
  );
}