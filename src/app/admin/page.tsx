// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Gift,
  Bug,
  Lightbulb,
  LogIn
} from 'lucide-react';
import { adminApi, AdminApiError } from '@/lib/api-client-admin';
import { handleApiError } from '@/lib/api-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FeedbackStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  byType: {
    bonus_completion: number;
    suggestion: number;
    data_correction: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // 獲取統計資料
      const response = await adminApi.stats.get();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || '無法載入統計資料');
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
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

  const statCards = [
    {
      title: '總回報數',
      value: stats?.total || 0,
      icon: MessageSquare,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: '待處理',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: '處理中',
      value: stats?.inProgress || 0,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: '已解決',
      value: stats?.resolved || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const typeCards = [
    {
      title: '特典補完',
      value: stats?.byType.bonus_completion || 0,
      icon: Gift,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: '意見建議',
      value: stats?.byType.suggestion || 0,
      icon: Lightbulb,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: '資料修正',
      value: stats?.byType.data_correction || 0,
      icon: Bug,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">儀表板</h1>
          <p className="text-muted-foreground">管理後台總覽</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">儀表板</h1>
        <p className="text-muted-foreground">管理後台總覽</p>
      </div>

      {/* 狀態統計卡片 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="touch-manipulation">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-2 rounded-full flex-shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.total ? `佔總數 ${Math.round((card.value / stats.total) * 100)}%` : '-'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 類型統計卡片 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">回報類型分布</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {typeCards.map((card) => (
            <Card key={card.title} className="touch-manipulation">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-full flex-shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.total ? `佔總數 ${Math.round((card.value / stats.total) * 100)}%` : '-'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用功能快捷方式</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <a
            href="/admin/feedbacks?status=pending"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors touch-manipulation"
          >
            <Clock className="h-6 w-6 text-warning flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">查看待處理回報</p>
              <p className="text-sm text-muted-foreground">
                {stats?.pending || 0} 個回報等待處理
              </p>
            </div>
          </a>
          <a
            href="/admin/feedbacks?type=bonus_completion"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors touch-manipulation"
          >
            <Gift className="h-6 w-6 text-secondary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">查看特典補完</p>
              <p className="text-sm text-muted-foreground">
                {stats?.byType.bonus_completion || 0} 個特典回報
              </p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}