'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Gift,
  Search,
  ArrowUpDown,
  Film,
  Building,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import type { Movie, MoviePromotion, PromotionGift } from '@/lib/types';
import { movieApi } from '@/lib/api-endpoints';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

/** 影城名稱常數 */
const CINEMA_NAMES = ['威秀影城', '國賓影城', '秀泰影城', '美麗華', 'in89', '喜滿客'] as const;

interface CinemaBonus {
  cinema: string;
  promotions: MoviePromotion[];
  totalGifts: number;
  hasExclusive: boolean;
}

interface MovieCompareData {
  movie: Movie;
  cinemas: CinemaBonus[];
  totalPromotions: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * 從 promotion title 中萃取影城名稱
 * 格式通常是 "影城名 - 特典名" 或含有影城名的字串
 */
function extractCinema(promotion: MoviePromotion): string {
  const title = promotion.title || '';
  const desc = promotion.description || '';
  const combined = `${title} ${desc}`;

  for (const name of CINEMA_NAMES) {
    if (combined.includes(name)) return name;
  }

  // 嘗試從 title 的 "XXX - " 格式萃取
  const dashMatch = title.match(/^(.+?)\s*[-–—]\s*/);
  if (dashMatch) {
    const prefix = dashMatch[1].trim();
    if (prefix.length <= 10) return prefix;
  }

  return '其他影城';
}

/**
 * 將 promotions 按影城分組
 */
function groupByCinema(promotions: MoviePromotion[]): CinemaBonus[] {
  const map = new Map<string, MoviePromotion[]>();

  for (const p of promotions) {
    const cinema = extractCinema(p);
    if (!map.has(cinema)) map.set(cinema, []);
    map.get(cinema)!.push(p);
  }

  return Array.from(map.entries())
    .map(([cinema, promos]) => ({
      cinema,
      promotions: promos,
      totalGifts: promos.reduce((sum, p) => sum + (p.gifts?.length || 0), 0),
      hasExclusive: promos.some(p => p.gifts?.some(g => g.is_exclusive)),
    }))
    .sort((a, b) => b.totalGifts - a.totalGifts);
}

// ============================================================================
// Sub-components
// ============================================================================

function CompareLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CinemaBonusCard({ data }: { data: CinemaBonus }) {
  const [expanded, setExpanded] = useState(false);
  const displayPromos = expanded ? data.promotions : data.promotions.slice(0, 2);

  return (
    <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{data.cinema}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {data.hasExclusive && (
            <Badge variant="destructive" className="text-xs">
              <Star className="h-3 w-3 mr-0.5" />
              獨家
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {data.totalGifts} 項贈品
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {displayPromos.map((promo) => (
          <div key={promo.id} className="text-sm space-y-1">
            <p className="font-medium text-foreground line-clamp-1">
              {promo.title.replace(/^.+?\s*[-–—]\s*/, '')}
            </p>
            {promo.description && (
              <p className="text-muted-foreground text-xs line-clamp-2">
                {promo.description}
              </p>
            )}
            {promo.gifts && promo.gifts.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {promo.gifts.map((gift) => (
                  <Badge key={gift.id} variant="outline" className="text-xs py-0">
                    <Gift className="h-3 w-3 mr-0.5" />
                    {gift.gift_name}
                    {gift.is_exclusive && ' ⭐'}
                  </Badge>
                ))}
              </div>
            )}
            {promo.release_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {promo.release_date}
                {promo.end_date && ` ~ ${promo.end_date}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {data.promotions.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>收起 <ChevronUp className="h-3 w-3 ml-1" /></>
          ) : (
            <>展開全部 ({data.promotions.length} 項) <ChevronDown className="h-3 w-3 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
}

function MovieCompareCard({ data }: { data: MovieCompareData }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {data.movie.poster_url && (
              <img
                src={data.movie.poster_url}
                alt={data.movie.title}
                className="w-12 h-16 object-cover rounded"
              />
            )}
            <div>
              <Link href={`/movie/${data.movie.id}`}>
                <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                  {data.movie.title}
                </CardTitle>
              </Link>
              {data.movie.english_title && (
                <p className="text-sm text-muted-foreground">{data.movie.english_title}</p>
              )}
            </div>
          </div>
          <Badge variant="outline">
            {data.cinemas.length} 間影城 · {data.totalPromotions} 項特典
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.cinemas.map((cb) => (
            <CinemaBonusCard key={cb.cinema} data={cb} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

type SortMode = 'cinemas' | 'promotions' | 'name';

export default function BonusCompare() {
  const [movieCompareList, setMovieCompareList] = useState<MovieCompareData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('cinemas');
  const [filterCinema, setFilterCinema] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        // Get all movies
        const movies = await movieApi.getAllMovies();

        // Get all bonuses
        const bonusesResponse = await apiClient.get<{
          success: boolean;
          movies: Array<{
            movie_id: string;
            title: string;
            promotions: MoviePromotion[] | null;
          }>;
        }>('/api/v1/movie-bonuses?limit=200');

        if (!bonusesResponse.success || !bonusesResponse.data?.success) {
          throw new Error('無法載入特典資料');
        }

        const bonusMovies = bonusesResponse.data.movies || [];

        // Build compare list
        const compareList: MovieCompareData[] = [];

        for (const bm of bonusMovies) {
          const promos = bm.promotions || [];
          if (promos.length === 0) continue;

          const movie = movies.find(m => m.id === bm.movie_id);
          if (!movie) continue;

          const cinemas = groupByCinema(promos);
          // Only include movies with promotions from multiple cinemas for compare
          // But also show single-cinema movies in the full list
          compareList.push({
            movie,
            cinemas,
            totalPromotions: promos.length,
          });
        }

        setMovieCompareList(compareList);
      } catch (err: any) {
        setError(err.message || '載入失敗');
        console.error('BonusCompare load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  // Collect all unique cinema names
  const allCinemas = useMemo(() => {
    const set = new Set<string>();
    movieCompareList.forEach(m => m.cinemas.forEach(c => set.add(c.cinema)));
    return Array.from(set).sort();
  }, [movieCompareList]);

  // Filter & sort
  const filteredList = useMemo(() => {
    let list = movieCompareList;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        m =>
          m.movie.title.toLowerCase().includes(q) ||
          (m.movie.english_title || '').toLowerCase().includes(q)
      );
    }

    // Cinema filter
    if (filterCinema) {
      list = list.filter(m => m.cinemas.some(c => c.cinema === filterCinema));
    }

    // Sort
    switch (sortMode) {
      case 'cinemas':
        list = [...list].sort((a, b) => b.cinemas.length - a.cinemas.length);
        break;
      case 'promotions':
        list = [...list].sort((a, b) => b.totalPromotions - a.totalPromotions);
        break;
      case 'name':
        list = [...list].sort((a, b) => a.movie.title.localeCompare(b.movie.title, 'zh-TW'));
        break;
    }

    return list;
  }, [movieCompareList, search, filterCinema, sortMode]);

  // Multi-cinema movies only (for the compare tab)
  const multiCinemaList = useMemo(
    () => filteredList.filter(m => m.cinemas.length >= 2),
    [filteredList]
  );

  if (isLoading) return <CompareLoadingSkeleton />;

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">載入失敗</p>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header / Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            特典比價
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            跨影城同電影特典比較，一眼看出哪間影城特典最豐富
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline">{movieCompareList.length} 部電影</Badge>
          <Badge variant="outline">{allCinemas.length} 間影城</Badge>
          <Badge variant="default">{multiCinemaList.length} 部可比較</Badge>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋電影名稱..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Cinema filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCinema === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCinema(null)}
          >
            全部
          </Button>
          {allCinemas.map(c => (
            <Button
              key={c}
              variant={filterCinema === c ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCinema(filterCinema === c ? null : c)}
            >
              {c}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1">
          {([
            ['cinemas', '影城數'],
            ['promotions', '特典數'],
            ['name', '片名'],
          ] as [SortMode, string][]).map(([mode, label]) => (
            <Button
              key={mode}
              variant={sortMode === mode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSortMode(mode)}
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs: compare vs all */}
      <Tabs defaultValue="compare">
        <TabsList>
          <TabsTrigger value="compare">
            <Film className="h-4 w-4 mr-1" />
            跨影城比較 ({multiCinemaList.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            全部特典 ({filteredList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compare" className="space-y-4 mt-4">
          {multiCinemaList.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>目前沒有跨影城的特典比較資料</p>
                <p className="text-sm mt-1">當同一部電影在多間影城有特典時，就會出現在這裡</p>
              </CardContent>
            </Card>
          ) : (
            multiCinemaList.map(data => (
              <MovieCompareCard key={data.movie.id} data={data} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {filteredList.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>沒有找到符合條件的特典</p>
              </CardContent>
            </Card>
          ) : (
            filteredList.map(data => (
              <MovieCompareCard key={data.movie.id} data={data} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
