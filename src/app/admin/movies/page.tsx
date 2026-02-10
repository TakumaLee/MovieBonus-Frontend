// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ResponsiveTable, ResponsiveTableBody, MobileCardItem, TouchFriendlyButton } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api-client-admin';
import { Movie, MovieStatus } from '@/lib/types';
import { Search, Calendar, Clock, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { getMovieStatus, getStatusVariant, getStatusText } from '@/lib/movie-utils';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MoviesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  // 載入電影列表
  const loadMovies = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: pagination.limit,
      };
      
      if (search) {
        params.search = search;
      }
      
      const response = await adminApi.movies.list(params);
      
      if (response.success) {
        setMovies(response.data.movies || []);
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load movies:', error);
      toast({
        title: '載入失敗',
        description: '無法載入電影列表，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadMovies();
  }, []);
  
  // 處理搜尋
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
    loadMovies(1, searchQuery);
  };
  
  // 處理分頁
  const handlePageChange = (newPage: number) => {
    loadMovies(newPage, searchTerm);
  };
  
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yyyy/MM/dd', { locale: zhTW });
    } catch {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold">電影管理</h1>
        <p className="text-muted-foreground mt-2">管理電影資訊與特典內容</p>
      </div>
      
      {/* 搜尋區塊 */}
      <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle>搜尋電影</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="搜尋電影名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-[48px] md:min-h-[40px]"
              />
            </div>
            <Button 
              type="submit" 
              className="min-h-[48px] md:min-h-[40px] w-full sm:w-auto touch-manipulation"
            >
              搜尋
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* 電影列表 */}
      <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle>電影列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <EmptyState
              icon={<Film className="h-12 w-12" />}
              title="沒有找到電影"
              description={searchTerm ? "請嘗試其他搜尋關鍵字" : "目前沒有電影資料"}
            />
          ) : (
            <>
              <ResponsiveTable>
                {/* Desktop Table Header */}
                <TableHeader className="hidden md:table-header-group">
                  <TableRow>
                    <TableHead>電影名稱</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>上映日期</TableHead>
                    <TableHead>下檔日期</TableHead>
                    <TableHead>特典數量</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                
                <ResponsiveTableBody>
                  {movies.map((movie) => (
                    <TableRow key={movie.id}>
                      {/* Desktop Table Cells */}
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <div className="font-medium">{movie.title}</div>
                          {movie.english_title && (
                            <div className="text-sm text-muted-foreground">{movie.english_title}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={getStatusVariant(getMovieStatus(movie))}>
                          {getStatusText(getMovieStatus(movie))}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(movie.release_date)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDate(movie.end_date)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">
                          {movie.bonus_count || 0} 個特典
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/movies/${movie.id}`)}
                        >
                          管理特典
                        </Button>
                      </TableCell>

                      {/* Mobile Card Layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{movie.title}</h3>
                            {movie.english_title && (
                              <p className="text-sm text-muted-foreground truncate">{movie.english_title}</p>
                            )}
                          </div>
                          <Badge variant={getStatusVariant(getMovieStatus(movie))} className="flex-shrink-0">
                            {getStatusText(getMovieStatus(movie))}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <MobileCardItem label="上映日期">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(movie.release_date)}
                            </div>
                          </MobileCardItem>
                          
                          <MobileCardItem label="下檔日期">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDate(movie.end_date)}
                            </div>
                          </MobileCardItem>
                          
                          <MobileCardItem label="特典數量">
                            <Badge variant="secondary">
                              {movie.bonus_count || 0} 個特典
                            </Badge>
                          </MobileCardItem>
                        </div>

                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/movies/${movie.id}`)}
                            className="w-full min-h-[48px] touch-manipulation"
                          >
                            管理特典
                          </Button>
                        </div>
                      </div>
                    </TableRow>
                  ))}
                </ResponsiveTableBody>
              </ResponsiveTable>
              
              {/* 分頁控制 */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
                  <p className="text-sm text-muted-foreground text-center md:text-left">
                    顯示 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 筆，
                    共 {pagination.total} 筆
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="min-h-[48px] md:min-h-[40px] touch-manipulation"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">上一頁</span>
                    </Button>
                    <span className="text-sm px-3 py-2 bg-muted rounded text-center min-w-[80px]">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="min-h-[48px] md:min-h-[40px] touch-manipulation"
                    >
                      <span className="hidden sm:inline mr-2">下一頁</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}