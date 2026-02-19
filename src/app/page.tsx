'use client';

import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, AlertCircle, RefreshCw, Film } from 'lucide-react';
import { useNowPlayingMovies, useComingSoonMovies } from '@/hooks';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { SearchBar } from '@/components/SearchBar';
import { SmartNavigation } from '@/components/SmartNavigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import FeedbackForm from '@/components/FeedbackForm';
import { MovieImage } from '@/components/MovieImage';
import { DonationButton } from '@/components/DonationButton';
import { donationConfig } from '@/lib/donation-config';
import type { Movie } from '@/lib/types';
import { getMovieStatus, getStatusText, getStatusVariant } from '@/lib/movie-utils';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  isClickable: boolean;
}

const MovieCard = ({ movie, isClickable }: MovieCardProps) => {
  // Use has_bonuses directly from movie data instead of separate API call
  const hasBonuses = movie.has_bonuses || false;
  
  // Log poster URL for debugging
  console.log('Movie poster URL:', movie.poster_url, 'for movie:', movie.title);

  const cardContent = (
    <Card className="overflow-hidden group border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/20">
      <CardContent className="p-0 relative aspect-[2/3]">
        <MovieImage
          src={movie.poster_url || ''}
          alt={`${movie.title}電影海報 - 特典速報`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="movie poster"
        />
        {hasBonuses && (
          <Badge variant="warning" className="absolute top-3 right-3 shadow-lg backdrop-blur-sm">
            <Award className="w-3 h-3 mr-1" />
            特典
          </Badge>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
          <h3 className="font-headline text-base sm:text-lg text-white font-semibold drop-shadow-md line-clamp-2">{movie.title}</h3>
          {movie.english_title && (
            <p className="text-xs sm:text-sm text-white/80 font-medium line-clamp-1 mt-1">{movie.english_title}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getStatusVariant(getMovieStatus(movie))} className="text-xs backdrop-blur-sm bg-opacity-90">
              {getStatusText(getMovieStatus(movie))}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return (
      <Link href={`/movie/${encodeURIComponent(movie.id)}`} className="block focus:outline-none focus:ring-4 focus:ring-ring rounded-lg">
        {cardContent}
      </Link>
    );
  }

  return <div>{cardContent}</div>;
};

// Loading skeleton for movie grid
const MovieGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mt-8">
    {Array.from({ length: 12 }).map((_, index) => (
      <div key={index} className="space-y-3">
        <Skeleton className="w-full aspect-[2/3] rounded-lg" />
        <div className="space-y-2 px-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    ))}
  </div>
);

// Error state component
const ErrorStateComponent = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <EmptyState
    icon={<AlertCircle className="h-12 w-12" />}
    title="載入失敗"
    description={message}
    action={{ label: "重試", onClick: onRetry }}
  />
);

// Empty state component  
const EmptyStateComponent = ({ message }: { message: string }) => (
  <EmptyState
    icon={<Film className="h-12 w-12" />}
    title="暫無電影資料"
    description={message}
  />
);

// Movie grid with loading and error states
const MovieGrid = ({ 
  movies, 
  isLoading, 
  error, 
  onRetry, 
  isClickable = true,
  emptyMessage = "目前沒有電影資料"
}: { 
  movies: Movie[]; 
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
  isClickable?: boolean;
  emptyMessage?: string;
}) => {
  if (isLoading) {
    return <MovieGridSkeleton />;
  }

  if (error) {
    return <ErrorStateComponent message={error} onRetry={onRetry} />;
  }

  if (movies.length === 0) {
    return <EmptyStateComponent message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mt-8 animate-in fade-in duration-500">
      {movies.map((movie, index) => (
        <MovieCard key={movie.id || `movie-${index}`} movie={movie} isClickable={isClickable} />
      ))}
    </div>
  );
};

export default function Home() {
  const nowPlayingHook = useNowPlayingMovies();
  const comingSoonHook = useComingSoonMovies();
  
  // Use scroll direction hook to control title visibility
  const { isAtTop } = useScrollDirection({
    threshold: 5,
    scrollUpThreshold: 20,
    offset: 10
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full bg-background">
        <SmartNavigation />
        <header className="pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-card to-card/50 border-b relative">
          {donationConfig.showHeaderButton && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <DonationButton position="header" />
            </div>
          )}
          <div className="max-w-4xl mx-auto text-center">
            <h1 
              className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline text-primary mb-4 mt-8 transition-all duration-500 ease-out",
                isAtTop ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
              )}
            >
              特典速報
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-body max-w-3xl mx-auto leading-relaxed">
              台灣電影院特典與限定禮品的完整追蹤平台，不錯過任何精彩好康！
            </p>
            
            <div className="mt-6 sm:mt-8 flex justify-center">
              <SearchBar className="w-full max-w-lg" placeholder="搜尋電影、演員、導演..." />
            </div>
          </div>
        </header>
        
        
        <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Introduction Section */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16">
            <div className="bg-gradient-to-br from-primary/5 via-card to-card/50 border rounded-2xl p-6 sm:p-8 lg:p-10">
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-headline text-foreground mb-3">
                  歡迎來到 MovieBonus 特典速報
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground">
                  台灣最完整的電影入場特典資訊平台
                </p>
              </div>
              
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">MovieBonus</strong> 整合威秀、秀泰、國賓等各大院線的特典發放資訊，讓你不再錯過任何限定好康！從日本動畫電影的精美周邊、好萊塢大片的限量海報，到獨立電影的特色收藏品，我們提供即時更新的完整資訊。
                </p>
                
                <div className="grid sm:grid-cols-3 gap-4 my-6">
                  <div className="bg-card/80 backdrop-blur-sm border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">19+</div>
                    <div className="text-sm text-muted-foreground">熱門電影</div>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">即時</div>
                    <div className="text-sm text-muted-foreground">特典更新</div>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">完整</div>
                    <div className="text-sm text-muted-foreground">院線涵蓋</div>
                  </div>
                </div>
                
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  無論你是特典收藏家、動畫狂熱粉絲，還是單純想知道「這部電影有沒有特典」，MovieBonus 都能幫你快速找到答案。我們提供電影上映時間、特典種類、發放數量、領取方式等完整資訊，讓你輕鬆規劃觀影行程。
                </p>
                
                <div className="flex flex-wrap gap-3 justify-center mt-6">
                  <Link 
                    href="/guide" 
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Film className="w-4 h-4" />
                    使用指南
                  </Link>
                  <Link 
                    href="/about" 
                    className="inline-flex items-center gap-2 bg-card border text-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-accent transition-colors text-sm"
                  >
                    關於我們
                  </Link>
                  <Link 
                    href="/blog" 
                    className="inline-flex items-center gap-2 bg-card border text-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-accent transition-colors text-sm"
                  >
                    📚 特典專欄
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="now-playing" className="max-w-7xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12 mb-8">
              <TabsTrigger value="now-playing" className="text-sm sm:text-base">正在上映</TabsTrigger>
              <TabsTrigger value="coming-soon" className="text-sm sm:text-base">即將上映</TabsTrigger>
            </TabsList>
          
          <TabsContent value="now-playing">
            {/* System status alert */}
            {nowPlayingHook.error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  無法連接到後端服務。{process.env.NODE_ENV === 'development' ? '請確認後端服務正在運行。' : '請稍後再試。'}
                </AlertDescription>
              </Alert>
            )}
            
            <MovieGrid 
              movies={nowPlayingHook.movies}
              isLoading={nowPlayingHook.isLoading}
              error={nowPlayingHook.error}
              onRetry={nowPlayingHook.refresh}
              isClickable={true}
              emptyMessage="目前沒有正在上映的電影資料"
            />
          </TabsContent>
          
          {/* 分頁間廣告 */}
          <div className="my-8">
          </div>
          
          <TabsContent value="coming-soon">
            {/* System status alert */}
            {comingSoonHook.error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  無法連接到後端服務。{process.env.NODE_ENV === 'development' ? '請確認後端服務正在運行。' : '請稍後再試。'}
                </AlertDescription>
              </Alert>
            )}
            
            <MovieGrid 
              movies={comingSoonHook.movies}
              isLoading={comingSoonHook.isLoading}
              error={comingSoonHook.error}
              onRetry={comingSoonHook.refresh}
              isClickable={true}
              emptyMessage="目前沒有即將上映的電影資料"
            />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-card border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Main Site Info */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-headline text-primary mb-2">特典速報</h3>
              <p className="text-sm text-muted-foreground mb-4">
                台灣電影特典資訊的最佳選擇
              </p>
              {donationConfig.showFooterLink && (
                <div className="mb-4">
                  <DonationButton position="footer" />
                </div>
              )}
            </div>
            
            {/* Blog Navigation */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-foreground mb-3">電影專欄</h4>
              <div className="space-y-2">
                <Link href="/blog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  最新文章
                </Link>
                <Link href="/reviews" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  影評專欄
                </Link>
                <Link href="/blog/category/news" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  電影新聞
                </Link>
                <Link href="/bonuses" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  特典情報
                </Link>
              </div>
            </div>
            
            {/* Additional Categories */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-foreground mb-3">更多分類</h4>
              <div className="space-y-2">
                <Link href="/theaters" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  戲院資訊
                </Link>
                <Link href="/boxoffice" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  票房分析
                </Link>
                <Link href="/blog/search" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  搜尋文章
                </Link>
                <Link href="/blog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  所有文章
                </Link>
              </div>
            </div>
          </div>
          
          {/* Copyright and Sources */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs text-muted-foreground">
              <span>資料來源：威秀影城、各大電影院</span>
              <span>即時更新</span>
              <span>© {new Date().getFullYear()} 特典速報</span>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Feedback Form */}
      <FeedbackForm />
      
      {/* Floating Donation Button */}
      {donationConfig.showFloatingButton && (
        <DonationButton position="floating" />
      )}
    </div>
    </ErrorBoundary>
  );
}
