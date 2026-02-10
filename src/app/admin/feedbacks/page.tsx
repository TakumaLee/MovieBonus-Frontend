// @ts-nocheck
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ResponsiveTable, ResponsiveTableBody, MobileCardItem, TouchFriendlyButton } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Gift,
  Lightbulb,
  Bug,
  Search,
  RefreshCw,
  Calendar,
  User,
  Mail,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Loader2,
  Link2
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { adminApi, AdminApiError } from '@/lib/api-client-admin';
import { handleApiError } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { BonusLinkProcessModal } from '@/components/admin/BonusLinkProcessModal';

interface Feedback {
  id: string;
  submission_id: string;
  feedback_type: string;
  title?: string;
  content: string;
  contact_email?: string;
  contact_name?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed' | 'spam';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  bonus_details?: BonusCompletionDetails;
}

interface BonusCompletionDetails {
  movie_title?: string;
  movie_english_title?: string;
  cinema_name?: string;
  bonus_type?: string;
  bonus_name?: string;
  bonus_description?: string;
  acquisition_method?: string;
  activity_period_start?: string;
  activity_period_end?: string;
  quantity_limit?: string;
  source_type?: string;
  source_url?: string;
  source_description?: string;
}

interface FilterState {
  status: string;
  type: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

const ITEMS_PER_PAGE = 10;

function FeedbacksContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [authError, setAuthError] = useState(false);
  const [linkProcessModalOpen, setLinkProcessModalOpen] = useState(false);
  const [selectedLinkFeedback, setSelectedLinkFeedback] = useState<Feedback | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get('status') || 'all',
    type: searchParams.get('type') || 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  // 載入回報資料
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);

      // 建立查詢參數
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      // 應用篩選
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      
      if (filters.type !== 'all') {
        params.type = filters.type;
      }
      
      if (filters.search) {
        params.search = filters.search;
      }
      
      if (filters.dateFrom) {
        params.date_from = filters.dateFrom;
      }
      
      if (filters.dateTo) {
        params.date_to = filters.dateTo;
      }

      const response = await adminApi.feedbacks.list(params);

      if (response.success && response.data) {
        setFeedbacks(response.data.feedbacks || []);
        setTotalCount(response.data.total || 0);
      } else {
        throw new Error(response.error || '無法載入回報資料');
      }
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error);
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (error.status === 401) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filters, currentPage]);

  // 更新回報狀態
  const updateFeedbackStatus = async (feedbackId: string, newStatus: string, notes?: string) => {
    setUpdating(true);
    try {
      const response = await adminApi.feedbacks.update(feedbackId, {
        status: newStatus,
        admin_notes: notes,
      });

      if (response.success) {
        toast({
          title: '更新成功',
          description: '回報狀態已更新',
        });

        // 重新載入資料
        fetchFeedbacks();
        setDetailsOpen(false);
      } else {
        throw new Error(response.error || '無法更新回報狀態');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      const errorMessage = handleApiError(error);
      toast({
        title: '更新失敗',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // 取得狀態標籤樣式
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '待處理', variant: 'outline' as const, icon: Clock },
      in_progress: { label: '處理中', variant: 'default' as const, icon: RefreshCw },
      resolved: { label: '已解決', variant: 'default' as const, icon: CheckCircle },
      closed: { label: '已關閉', variant: 'secondary' as const, icon: CheckCircle },
      spam: { label: '垃圾', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // 取得類型標籤樣式
  const getTypeBadge = (type: string) => {
    const typeConfig = {
      bonus_completion: { label: '特典補完', icon: Gift, color: 'text-secondary' },
      suggestion: { label: '意見建議', icon: Lightbulb, color: 'text-info' },
      data_correction: { label: '資料修正', icon: Bug, color: 'text-destructive' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || { 
      label: type, 
      icon: MessageSquare, 
      color: 'text-muted-foreground' 
    };
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        <span className="text-sm">{config.label}</span>
      </div>
    );
  };

  // 計算總頁數
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 檢查是否應該顯示處理連結按鈕
  const shouldShowProcessLinkButton = (feedback: Feedback): boolean => {
    // 必須是特典補完類型
    if (feedback.feedback_type !== 'bonus_completion') return false;
    
    // 檢查內容中是否包含 Facebook 連結
    const content = feedback.content?.toLowerCase() || '';
    const hasFacebookLink = content.includes('facebook.com') || content.includes('fb.com') || content.includes('fb.me');
    
    // 或者檢查 bonus_details 中的 source_url
    const sourceUrl = feedback.bonus_details?.source_url?.toLowerCase() || '';
    const hasSourceUrl = sourceUrl.includes('facebook.com') || sourceUrl.includes('fb.com') || sourceUrl.includes('fb.me');
    
    return hasFacebookLink || hasSourceUrl;
  };

  // 處理連結按鈕點擊
  const handleProcessLink = (feedback: Feedback) => {
    // 從內容或 source_url 中提取 Facebook URL
    let facebookUrl = feedback.bonus_details?.source_url || '';
    
    if (!facebookUrl || (!facebookUrl.includes('facebook.com') && !facebookUrl.includes('fb.com') && !facebookUrl.includes('fb.me'))) {
      // 嘗試從內容中提取 Facebook URL
      const urlRegex = /(https?:\/\/(?:www\.)?(?:facebook\.com|fb\.com|fb\.me)\/[^\s]+)/gi;
      const matches = feedback.content?.match(urlRegex);
      if (matches && matches.length > 0) {
        facebookUrl = matches[0];
      }
    }
    
    // 更新 feedback 物件以包含提取的 URL
    const updatedFeedback = {
      ...feedback,
      bonus_details: {
        ...feedback.bonus_details,
        source_url: facebookUrl
      }
    };
    
    setSelectedLinkFeedback(updatedFeedback);
    setLinkProcessModalOpen(true);
  };

  // 處理連結處理完成
  const handleLinkProcessComplete = () => {
    // 重新載入資料以更新狀態
    fetchFeedbacks();
  };

  if (loading && feedbacks.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication error UI
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <CardTitle>未授權存取</CardTitle>
            <CardDescription>
              您的登入狀態已過期或無效，請重新登入
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                無法存取管理後台，請確認您的登入狀態
              </AlertDescription>
            </Alert>
            <Link href="/admin/login" className="block">
              <Button className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                返回登入頁面
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">回報管理</h1>
        <p className="text-muted-foreground">管理和處理使用者回報</p>
      </div>

      {/* 篩選器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">狀態</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status-filter" className="min-h-[48px] md:min-h-[40px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="pending">待處理</SelectItem>
                  <SelectItem value="in_progress">處理中</SelectItem>
                  <SelectItem value="resolved">已解決</SelectItem>
                  <SelectItem value="closed">已關閉</SelectItem>
                  <SelectItem value="spam">垃圾</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">類型</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type-filter" className="min-h-[48px] md:min-h-[40px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="bonus_completion">特典補完</SelectItem>
                  <SelectItem value="suggestion">意見建議</SelectItem>
                  <SelectItem value="data_correction">資料修正</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">開始日期</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="min-h-[48px] md:min-h-[40px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">結束日期</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="min-h-[48px] md:min-h-[40px]"
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋提交編號、標題或內容..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9 min-h-[48px] md:min-h-[40px]"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    status: 'all',
                    type: 'all',
                    search: '',
                    dateFrom: '',
                    dateTo: '',
                  });
                  setCurrentPage(1);
                }}
                className="min-h-[48px] md:min-h-[40px] touch-manipulation"
              >
                重置
              </Button>
              <Button 
                onClick={fetchFeedbacks} 
                variant="outline"
                className="min-h-[48px] md:min-h-[40px] touch-manipulation"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重新整理
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 回報列表 */}
      <Card>
        <CardHeader>
          <CardTitle>回報列表</CardTitle>
          <CardDescription>
            共 {totalCount} 筆回報，顯示第 {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} 筆
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              沒有符合條件的回報
            </div>
          ) : (
            <ResponsiveTable>
              {/* Desktop Table Header */}
              <TableHeader className="hidden md:table-header-group">
                <TableRow>
                  <TableHead>提交編號</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>標題/內容</TableHead>
                  <TableHead>聯絡人</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>提交時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              
              <ResponsiveTableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    {/* Desktop Table Cells */}
                    <TableCell className="hidden md:table-cell font-mono text-sm">
                      {feedback.submission_id}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getTypeBadge(feedback.feedback_type)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs">
                      <div className="space-y-1">
                        {feedback.title && (
                          <p className="font-medium text-sm">{feedback.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {feedback.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        {feedback.contact_name && (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {feedback.contact_name}
                          </div>
                        )}
                        {feedback.contact_email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {feedback.contact_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getStatusBadge(feedback.status)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(feedback.created_at), 'MM/dd HH:mm', { locale: zhTW })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        {feedback.feedback_type === 'bonus_completion' && shouldShowProcessLinkButton(feedback) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessLink(feedback)}
                            title="處理 Facebook 連結"
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            處理連結
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          檢視
                        </Button>
                      </div>
                    </TableCell>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeBadge(feedback.feedback_type)}
                            {getStatusBadge(feedback.status)}
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">
                            #{feedback.submission_id}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(new Date(feedback.created_at), 'MM/dd HH:mm', { locale: zhTW })}
                        </span>
                      </div>

                      {feedback.title && (
                        <div>
                          <h4 className="font-medium text-sm">{feedback.title}</h4>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {feedback.content}
                        </p>
                      </div>

                      {(feedback.contact_name || feedback.contact_email) && (
                        <div className="space-y-1">
                          {feedback.contact_name && (
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {feedback.contact_name}
                            </div>
                          )}
                          {feedback.contact_email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {feedback.contact_email}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t flex flex-col gap-2">
                        {feedback.feedback_type === 'bonus_completion' && shouldShowProcessLinkButton(feedback) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessLink(feedback)}
                            className="w-full min-h-[48px] touch-manipulation"
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            處理連結
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setDetailsOpen(true);
                          }}
                          className="w-full min-h-[48px] touch-manipulation"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          檢視詳情
                        </Button>
                      </div>
                    </div>
                  </TableRow>
                ))}
              </ResponsiveTableBody>
            </ResponsiveTable>
          )}

          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                第 {currentPage} 頁，共 {totalPages} 頁
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[48px] md:min-h-[40px] touch-manipulation"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">上一頁</span>
                </Button>
                <span className="text-sm px-3 py-2 bg-muted rounded text-center min-w-[80px]">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="min-h-[48px] md:min-h-[40px] touch-manipulation"
                >
                  <span className="hidden sm:inline mr-2">下一頁</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 詳細資訊 Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>回報詳情</DialogTitle>
            <DialogDescription>
              提交編號: {selectedFeedback?.submission_id}
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">詳細資訊</TabsTrigger>
                {selectedFeedback.feedback_type === 'bonus_completion' && (
                  <TabsTrigger value="bonus">特典資訊</TabsTrigger>
                )}
                <TabsTrigger value="admin">管理操作</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>類型</Label>
                      <div className="mt-1">{getTypeBadge(selectedFeedback.feedback_type)}</div>
                    </div>
                    <div>
                      <Label>狀態</Label>
                      <div className="mt-1">{getStatusBadge(selectedFeedback.status)}</div>
                    </div>
                  </div>

                  {selectedFeedback.title && (
                    <div>
                      <Label>標題</Label>
                      <p className="mt-1">{selectedFeedback.title}</p>
                    </div>
                  )}

                  <div>
                    <Label>內容</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                      {selectedFeedback.content}
                    </div>
                    {/* 如果是特典補完且內容包含 Facebook 連結，顯示提示 */}
                    {selectedFeedback.feedback_type === 'bonus_completion' && 
                     (selectedFeedback.content?.toLowerCase().includes('facebook.com') || 
                      selectedFeedback.content?.toLowerCase().includes('fb.com') ||
                      selectedFeedback.content?.toLowerCase().includes('fb.me')) && (
                      <Alert className="mt-2">
                        <Link2 className="h-4 w-4" />
                        <AlertDescription>
                          此回報內容包含 Facebook 連結，您可以使用「處理連結」功能擷取特典資訊。
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>聯絡人姓名</Label>
                      <p className="mt-1">{selectedFeedback.contact_name || '-'}</p>
                    </div>
                    <div>
                      <Label>聯絡信箱</Label>
                      <p className="mt-1">{selectedFeedback.contact_email || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>提交時間</Label>
                      <p className="mt-1">
                        {format(new Date(selectedFeedback.created_at), 'yyyy/MM/dd HH:mm:ss', { locale: zhTW })}
                      </p>
                    </div>
                    <div>
                      <Label>最後更新</Label>
                      <p className="mt-1">
                        {format(new Date(selectedFeedback.updated_at), 'yyyy/MM/dd HH:mm:ss', { locale: zhTW })}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {selectedFeedback.feedback_type === 'bonus_completion' && selectedFeedback.bonus_details && (
                <TabsContent value="bonus" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>電影名稱</Label>
                        <p className="mt-1">{selectedFeedback.bonus_details.movie_title || '-'}</p>
                      </div>
                      <div>
                        <Label>英文名稱</Label>
                        <p className="mt-1">{selectedFeedback.bonus_details.movie_english_title || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>影城名稱</Label>
                        <p className="mt-1">{selectedFeedback.bonus_details.cinema_name || '-'}</p>
                      </div>
                      <div>
                        <Label>特典類型</Label>
                        <p className="mt-1">{selectedFeedback.bonus_details.bonus_type || '-'}</p>
                      </div>
                    </div>

                    <div>
                      <Label>特典名稱</Label>
                      <p className="mt-1">{selectedFeedback.bonus_details.bonus_name || '-'}</p>
                    </div>

                    <div>
                      <Label>特典描述</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                        {selectedFeedback.bonus_details.bonus_description || '-'}
                      </div>
                    </div>

                    <div>
                      <Label>取得方式</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                        {selectedFeedback.bonus_details.acquisition_method || '-'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>活動開始日期</Label>
                        <p className="mt-1">
                          {selectedFeedback.bonus_details.activity_period_start 
                            ? format(new Date(selectedFeedback.bonus_details.activity_period_start), 'yyyy/MM/dd', { locale: zhTW })
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <Label>活動結束日期</Label>
                        <p className="mt-1">
                          {selectedFeedback.bonus_details.activity_period_end
                            ? format(new Date(selectedFeedback.bonus_details.activity_period_end), 'yyyy/MM/dd', { locale: zhTW })
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>數量限制</Label>
                      <p className="mt-1">{selectedFeedback.bonus_details.quantity_limit || '-'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>資料來源</Label>
                        <p className="mt-1">{selectedFeedback.bonus_details.source_type || '-'}</p>
                      </div>
                      <div>
                        <Label>來源網址</Label>
                        {selectedFeedback.bonus_details.source_url ? (
                          <a 
                            href={selectedFeedback.bonus_details.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-primary hover:underline"
                          >
                            查看來源
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="mt-1">-</p>
                        )}
                      </div>
                    </div>

                    {selectedFeedback.bonus_details.source_description && (
                      <div>
                        <Label>來源說明</Label>
                        <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                          {selectedFeedback.bonus_details.source_description}
                        </div>
                      </div>
                    )}
                    
                    {/* 在詳情視窗中也顯示處理連結按鈕 */}
                    {shouldShowProcessLinkButton(selectedFeedback) && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleProcessLink(selectedFeedback);
                            setDetailsOpen(false); // 關閉詳情視窗
                          }}
                          className="w-full"
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          處理 Facebook 連結
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status-update">更新狀態</Label>
                    <Select 
                      value={selectedFeedback.status}
                      onValueChange={(value) => {
                        setSelectedFeedback(prev => prev ? { ...prev, status: value as any } : null);
                      }}
                    >
                      <SelectTrigger id="status-update" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">待處理</SelectItem>
                        <SelectItem value="in_progress">處理中</SelectItem>
                        <SelectItem value="resolved">已解決</SelectItem>
                        <SelectItem value="closed">已關閉</SelectItem>
                        <SelectItem value="spam">垃圾</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="admin-notes">管理員備註</Label>
                    <Textarea
                      id="admin-notes"
                      className="mt-2"
                      rows={4}
                      placeholder="輸入備註..."
                      value={selectedFeedback.admin_notes || ''}
                      onChange={(e) => {
                        setSelectedFeedback(prev => prev ? { ...prev, admin_notes: e.target.value } : null);
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (selectedFeedback) {
                          updateFeedbackStatus(
                            selectedFeedback.id,
                            selectedFeedback.status,
                            selectedFeedback.admin_notes
                          );
                        }
                      }}
                      disabled={updating}
                    >
                      {updating ? '更新中...' : '儲存變更'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDetailsOpen(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* 特典連結處理 Modal */}
      {selectedLinkFeedback && (
        <BonusLinkProcessModal
          open={linkProcessModalOpen}
          onOpenChange={setLinkProcessModalOpen}
          feedbackId={selectedLinkFeedback.id}
          facebookUrl={selectedLinkFeedback.bonus_details?.source_url || ''}
          bonusDetails={{
            movie_title: selectedLinkFeedback.bonus_details?.movie_title,
            movie_english_title: selectedLinkFeedback.bonus_details?.movie_english_title,
            cinema_name: selectedLinkFeedback.bonus_details?.cinema_name,
            bonus_type: selectedLinkFeedback.bonus_details?.bonus_type,
            bonus_name: selectedLinkFeedback.bonus_details?.bonus_name,
          }}
          onProcessComplete={handleLinkProcessComplete}
        />
      )}
    </div>
  );
}

export default function FeedbacksPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <FeedbacksContent />
    </Suspense>
  );
}