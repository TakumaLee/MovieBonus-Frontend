'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, Film, Gift, Info, ShieldCheck, TriangleAlert, RefreshCw, AlertCircle, Clock, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useMovieAnalytics } from '@/hooks/useMovieAnalytics';
import type { MoviePromotion } from '@/lib/types';
import { format } from 'date-fns';
import { use } from 'react';
import { getMovieStatus, getStatusVariant, getStatusText } from '@/lib/movie-utils';
import SocialShareCard from '@/components/SocialShareCard';

interface MovieDetailClientProps {
  params: Promise<{
    movieId: string;
  }>;
}

// Loading skeleton for movie detail
const MovieDetailSkeleton = () => (
  <div className="bg-background min-h-screen">
    <main className="container mx-auto py-8 sm:py-12 px-4">
      <div className="mb-8">
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <aside className="w-full lg:w-1/3 xl:w-1/4">
          <Card className="overflow-hidden">
            <Skeleton className="w-full aspect-[2/3]" />
            <CardHeader>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
          </Card>
        </aside>
        
        <div className="w-full lg:w-2/3 xl:w-3/4">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-px w-full" />
            
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`skeleton-${index}`}>
                <div className="grid md:grid-cols-3">
                  <Skeleton className="w-full aspect-square md:col-span-1" />
                  <div className="md:col-span-2 p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);

// Error state component
const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-background min-h-screen">
    <main className="container mx-auto py-8 sm:py-12 px-4">
      <div className="mb-8">
        <Button asChild variant="ghost">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Movies
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">載入失敗</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">{message}</p>
        <Button onClick={onRetry} className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          重試
        </Button>
      </div>
    </main>
  </div>
);

// Movie not found component
const MovieNotFound = () => (
  <div className="bg-background min-h-screen">
    <main className="container mx-auto py-8 sm:py-12 px-4">
      <div className="mb-8">
        <Button asChild variant="ghost">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Movies
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-2xl font-bold mb-2">找不到電影</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          抱歉，找不到您要查看的電影。可能該電影已被移除或 ID 不正確。
        </p>
        <Button asChild>
          <Link href="/">返回首頁</Link>
        </Button>
      </div>
    </main>
  </div>
);

// Promotion card component
const PromotionCard = ({ promotion }: { promotion: MoviePromotion }) => {
  // Check if there are any gift images available
  const hasImages = promotion.gifts?.some(gift => gift.gift_image_url) || false;
  
  return (
    <Card className="overflow-hidden shadow-md transition-shadow hover:shadow-xl">
      <div className={`grid ${hasImages ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
        {hasImages && (
          <div className="md:col-span-1">
            <img
              src={promotion.gifts?.find(gift => gift.gift_image_url)?.gift_image_url || 'https://placehold.co/300x300.png'}
              alt={`${promotion.title}特典商品圖片 - 特典速報`}
              className="w-full h-full object-cover"
              data-ai-hint="promotional item"
            />
          </div>
        )}
        <div className={hasImages ? "md:col-span-2" : "md:col-span-1"}>
        <CardHeader>
          <div key="header-title-section" className="flex items-center justify-between">
            <CardTitle key="title" className="text-2xl font-headline text-foreground">{promotion.title}</CardTitle>
            {promotion.is_active && (
              <Badge key="active-badge" variant="success">
                <Gift className="w-3 h-3 mr-1" />
                活躍中
              </Badge>
            )}
          </div>
          <Badge key="type-badge" variant="info" className="font-medium">{promotion.promotion_type}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {promotion.description && (
            <div key="description">
              <h4 className="font-bold flex items-center gap-2 mb-1">
                <Info className="w-4 h-4"/>
                描述
              </h4>
              <p className="text-muted-foreground">{promotion.description}</p>
            </div>
          )}
          
          <Separator key="separator"/>
          
          <div key="dates-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotion.release_date && (
              <div key="release-date">
                <h4 className="font-bold flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4"/>
                  發放日期
                </h4>
                <p className="text-muted-foreground">
                  {format(new Date(promotion.release_date), 'yyyy年MM月dd日')}
                </p>
              </div>
            )}
            
            {promotion.end_date && (
              <div key="end-date">
                <h4 className="font-bold flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4"/>
                  結束日期
                </h4>
                <p className="text-muted-foreground">
                  {format(new Date(promotion.end_date), 'yyyy年MM月dd日')}
                </p>
              </div>
            )}
          </div>

          {promotion.acquisition_method && (
            <div key="acquisition-method">
              <h4 className="font-bold flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4"/>
                取得方式
              </h4>
              <p className="text-muted-foreground">{promotion.acquisition_method}</p>
            </div>
          )}

          {promotion.terms_and_conditions && (
            <div key="terms-conditions">
              <h4 className="font-bold flex items-center gap-2 mb-1">
                <Info className="w-4 h-4"/>
                條款與條件
              </h4>
              <p className="text-muted-foreground text-sm">{promotion.terms_and_conditions}</p>
            </div>
          )}

          {promotion.gifts && promotion.gifts.length > 0 && (
            <div key="gifts">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4"/>
                贈品項目
              </h4>
              <div className="space-y-2">
                {promotion.gifts.map((gift, giftIndex) => (
                  <div key={gift.id || `gift-${giftIndex}`} className="bg-muted/50 rounded-lg p-3">
                    <div key="gift-header" className="flex items-center justify-between mb-1">
                      <h5 className="font-medium">{gift.gift_name}</h5>
                      {gift.is_exclusive && (
                        <Badge variant="secondary" className="text-xs">獨家</Badge>
                      )}
                    </div>
                    {gift.gift_description && (
                      <p key="gift-description" className="text-sm text-muted-foreground mb-2">{gift.gift_description}</p>
                    )}
                    <div key="gift-details" className="flex items-center gap-4 text-xs text-muted-foreground">
                      {gift.quantity && <span key="quantity">數量: {gift.quantity}</span>}
                      <span key="per-person-limit">每人限制: {gift.per_person_limit}</span>
                      {gift.estimated_value && <span key="estimated-value">估值: ${gift.estimated_value}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        </div>
      </div>
    </Card>
  );
};

export function MovieDetailClient({ params }: MovieDetailClientProps) {
  const resolvedParams = use(params);
  const movieId = decodeURIComponent(resolvedParams.movieId);
  const { movie, bonuses, isLoading, error, refetch } = useMovieDetail({
    movieId,
    autoFetch: true,
  });

  // Initialize analytics tracking
  const { trackBonusView, trackBonusInterest, trackExternalLink } = useMovieAnalytics({
    movie,
    promotions: bonuses,
    isLoading,
  });

  // Loading state
  if (isLoading) {
    return <MovieDetailSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  // Movie not found
  if (!movie) {
    return <MovieNotFound />;
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto py-8 sm:py-12 px-4">
        <div className="mb-8">
          <Button asChild variant="ghost">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Movies
            </Link>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Movie Poster and Basic Info */}
          <aside className="w-full lg:w-1/3 xl:w-1/4">
            <Card className="overflow-hidden sticky top-8">
              <img
                src={movie.poster_url || 'https://placehold.co/400x600.png'}
                alt={`${movie.title}電影海報 - 完整資訊與特典速報`}
                className="w-full h-auto object-cover"
                data-ai-hint="movie poster"
              />
              <CardHeader>
                <CardTitle key="title" className="font-headline text-3xl text-primary">{movie.title}</CardTitle>
                {movie.english_title && (
                  <p key="english-title" className="text-lg text-muted-foreground font-medium">{movie.english_title}</p>
                )}
                
                {/* Movie Status Badge */}
                <div key="status-badges" className="flex items-center gap-2 mt-4">
                  <Badge variant={getStatusVariant(getMovieStatus(movie))}>
                    {getStatusText(getMovieStatus(movie))}
                  </Badge>
                  {bonuses.length > 0 && (
                    <Badge variant="info">
                      <Gift className="w-3 h-3 mr-1" />
                      {bonuses.length} 個特典
                    </Badge>
                  )}
                </div>

                {/* Movie Details */}
                <div key="movie-details" className="space-y-3 mt-6 text-sm">
                  {movie.duration && (
                    <div key="duration" className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{movie.duration} 分鐘</span>
                    </div>
                  )}
                  
                  {movie.rating && (
                    <div key="rating" className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <span>分級: {movie.rating}</span>
                    </div>
                  )}
                  
                  {movie.release_date && (
                    <div key="release-date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>上映日期: {format(new Date(movie.release_date), 'yyyy年MM月dd日')}</span>
                    </div>
                  )}

                  {movie.genre && movie.genre.length > 0 && (
                    <div key="genre">
                      <h4 className="font-medium mb-2">類型</h4>
                      <div className="flex flex-wrap gap-1">
                        {movie.genre.map((g, index) => (
                          <Badge key={`${g}-${index}`} variant="outline" className="text-xs">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {movie.director && movie.director.length > 0 && (
                    <div key="director">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        導演
                      </h4>
                      <p className="text-muted-foreground">{movie.director.join(', ')}</p>
                    </div>
                  )}

                  {movie.movie_cast && movie.movie_cast.length > 0 && (
                    <div key="cast">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        演員
                      </h4>
                      <p className="text-muted-foreground">{movie.movie_cast.slice(0, 3).join(', ')}</p>
                      {movie.movie_cast.length > 3 && (
                        <p className="text-xs text-muted-foreground mt-1">等 {movie.movie_cast.length} 位演員</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Synopsis */}
                {movie.synopsis && (
                  <div key="synopsis" className="mt-6">
                    <h4 className="font-medium mb-2">劇情簡介</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{movie.synopsis}</p>
                  </div>
                )}
                
                {/* Sidebar Ad */}
                <div className="mt-6">
                  </div>
              </CardHeader>
            </Card>
          </aside>

          {/* Bonuses Section */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            <div key="bonuses-header" className="flex items-center gap-4 mb-6">
              <Gift className="w-8 h-8 text-secondary"/>
              <h2 className="text-3xl md:text-4xl font-headline text-foreground">Available Bonuses</h2>
              <div className="ml-auto">
                <SocialShareCard
                  movie={movie}
                  bonuses={bonuses}
                  movieUrl={`/movie/${encodeURIComponent(movieId)}`}
                />
              </div>
            </div>
            
            <Separator key="bonuses-separator" className="mb-8" />

            {/* Top Ad in Bonuses Section */}
            <div className="mb-8">
              </div>

            {/* Connection Error Alert */}
            {error && (
              <Alert key="error-alert" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  無法連接到後端服務。{process.env.NODE_ENV === 'development' ? '請確認後端服務正在運行。' : '請稍後再試。'}
                </AlertDescription>
              </Alert>
            )}

            {/* No Bonuses */}
            {!error && bonuses.length === 0 && (
              <Card key="no-bonuses" className="bg-card/80">
                <CardContent className="p-6 flex items-center gap-4">
                  <Film className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-bold text-lg">目前無特典</h3>
                    <p className="text-muted-foreground">
                      這部電影目前還沒有公佈特典資訊。請稍後再來查看！
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bonuses List */}
            {!error && bonuses.length > 0 && (
              <div key="bonuses-list" className="space-y-6">
                {bonuses.map((bonus, index) => (
                  <PromotionCard key={bonus.id || `bonus-${index}`} promotion={bonus} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 