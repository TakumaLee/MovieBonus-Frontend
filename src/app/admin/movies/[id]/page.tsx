// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api-client-admin';
import { Movie, MoviePromotion, MovieStatus } from '@/lib/types';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Film, 
  Gift, 
  Plus,
  Edit,
  Trash,
  Power
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { getMovieStatus, getStatusVariant, getStatusText } from '@/lib/movie-utils';
import MovieBonusForm from '@/components/admin/MovieBonusForm';
import BonusCard from '@/components/admin/BonusCard';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const movieId = params.id as string;
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [promotions, setPromotions] = useState<MoviePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<MoviePromotion | null>(null);
  
  // 載入電影資料
  const loadMovie = async () => {
    try {
      setLoading(true);
      const response = await adminApi.movies.get(movieId);
      
      if (response.success) {
        setMovie(response.data);
      }
    } catch (error) {
      console.error('Failed to load movie:', error);
      toast({
        title: '載入失敗',
        description: '無法載入電影資料',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 載入特典資料
  const loadPromotions = async () => {
    try {
      setPromotionsLoading(true);
      const response = await adminApi.movies.promotions.list(movieId);
      
      if (response.success) {
        setPromotions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load promotions:', error);
      toast({
        title: '載入失敗',
        description: '無法載入特典資料',
        variant: 'destructive',
      });
    } finally {
      setPromotionsLoading(false);
    }
  };
  
  useEffect(() => {
    loadMovie();
    loadPromotions();
  }, [movieId]);
  
  // 處理新增特典
  const handleAddPromotion = async (data: any) => {
    try {
      // 轉換前端格式為後端預期格式
      const backendData = {
        movie_title: movie?.title || '',
        bonuses: data.gifts?.map((gift: any) => ({
          bonus_name: gift.gift_name,
          acquisition_method: data.acquisition_method || gift.gift_description || '詳見活動規則',
          release_date: data.release_date || '依活動公告',
        })) || [{
          bonus_name: data.title || '特典',
          acquisition_method: data.acquisition_method || data.description || '詳見活動規則',
          release_date: data.release_date || '依活動公告',
        }],
        check_duplicates: true
      };
      
      const response = await adminApi.movies.promotions.create(movieId, backendData);
      
      if (response.success) {
        toast({
          title: '新增成功',
          description: '特典已成功新增',
        });
        setShowAddForm(false);
        loadPromotions();
      }
    } catch (error) {
      console.error('Failed to add promotion:', error);
      toast({
        title: '新增失敗',
        description: '無法新增特典，請稍後再試',
        variant: 'destructive',
      });
    }
  };
  
  // 處理編輯特典
  const handleEditPromotion = async (promotionId: string, data: any) => {
    try {
      // 轉換前端格式為後端預期格式
      const updateData: any = {
        title: data.title,
        description: data.description,
        status: data.is_active ? 'active' : 'inactive',
      };
      
      // 只包含有值的欄位
      if (data.release_date) updateData.start_date = data.release_date;
      if (data.end_date) updateData.end_date = data.end_date;
      if (data.acquisition_method) updateData.purchase_condition = data.acquisition_method;
      if (data.is_verified !== undefined) updateData.is_verified = data.is_verified;
      
      const response = await adminApi.movies.promotions.update(movieId, promotionId, updateData);
      
      if (response.success) {
        toast({
          title: '更新成功',
          description: '特典已成功更新',
        });
        setEditingPromotion(null);
        loadPromotions();
      }
    } catch (error) {
      console.error('Failed to update promotion:', error);
      toast({
        title: '更新失敗',
        description: '無法更新特典，請稍後再試',
        variant: 'destructive',
      });
    }
  };
  
  // 處理刪除特典
  const handleDeletePromotion = async (promotionId: string) => {
    if (!confirm('確定要刪除這個特典嗎？此操作無法復原。')) {
      return;
    }
    
    try {
      const response = await adminApi.movies.promotions.delete(movieId, promotionId);
      
      if (response.success) {
        toast({
          title: '刪除成功',
          description: '特典已成功刪除',
        });
        loadPromotions();
      }
    } catch (error) {
      console.error('Failed to delete promotion:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除特典，請稍後再試',
        variant: 'destructive',
      });
    }
  };
  
  // 處理切換特典狀態
  const handleToggleStatus = async (promotionId: string) => {
    try {
      const response = await adminApi.movies.promotions.toggleStatus(movieId, promotionId);
      
      if (response.success) {
        toast({
          title: '狀態更新成功',
          description: '特典狀態已更新',
        });
        loadPromotions();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast({
        title: '更新失敗',
        description: '無法更新特典狀態，請稍後再試',
        variant: 'destructive',
      });
    }
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
  
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  if (!movie) {
    return (
      <div className="text-center py-12">
        <Film className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">找不到電影</h3>
        <p className="text-muted-foreground mb-4">此電影不存在或已被刪除</p>
        <Button onClick={() => router.push('/admin/movies')}>
          返回電影列表
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 返回按鈕 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/movies')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        返回電影列表
      </Button>
      
      {/* 電影資訊卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{movie.title}</CardTitle>
              {movie.english_title && (
                <p className="text-muted-foreground mt-1">{movie.english_title}</p>
              )}
            </div>
            <Badge variant={getStatusVariant(getMovieStatus(movie))}>
              {getStatusText(getMovieStatus(movie))}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 海報 */}
            {movie.poster_url && (
              <div className="md:col-span-1">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
            
            {/* 電影資訊 */}
            <div className={`space-y-4 ${movie.poster_url ? 'md:col-span-2' : 'md:col-span-3'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">上映日期</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(movie.release_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">下檔日期</p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDate(movie.end_date)}
                  </p>
                </div>
              </div>
              
              {movie.genre && movie.genre.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">類型</p>
                  <div className="flex flex-wrap gap-2">
                    {movie.genre.map((g, index) => (
                      <Badge key={index} variant="secondary">{g}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {movie.synopsis && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">劇情簡介</p>
                  <p className="text-sm">{movie.synopsis}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {movie.director && movie.director.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">導演</p>
                    <p className="text-sm">{movie.director.join(', ')}</p>
                  </div>
                )}
                {movie.duration && (
                  <div>
                    <p className="text-sm text-muted-foreground">片長</p>
                    <p className="text-sm">{movie.duration} 分鐘</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 特典管理區塊 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              特典管理
            </CardTitle>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              新增特典
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-6">
              <MovieBonusForm
                movieId={movieId}
                onSubmit={handleAddPromotion}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}
          
          {promotionsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">尚無特典</h3>
              <p className="text-muted-foreground">點擊上方「新增特典」按鈕來新增第一個特典</p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promotion) => (
                <div key={promotion.id}>
                  {editingPromotion?.id === promotion.id ? (
                    <MovieBonusForm
                      movieId={movieId}
                      promotion={promotion}
                      onSubmit={(data) => handleEditPromotion(promotion.id, data)}
                      onCancel={() => setEditingPromotion(null)}
                    />
                  ) : (
                    <BonusCard
                      promotion={promotion}
                      onEdit={() => setEditingPromotion(promotion)}
                      onDelete={() => handleDeletePromotion(promotion.id)}
                      onToggleStatus={() => handleToggleStatus(promotion.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}