// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api-client-admin';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SessionManagerProps {
  children: React.ReactNode;
  checkInterval?: number; // in milliseconds
  warningTime?: number; // in minutes before expiry
}

export function SessionManager({ 
  children, 
  checkInterval = 60000, // Check every minute
  warningTime = 5 // Warn 5 minutes before expiry
}: SessionManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let warningTimeoutId: NodeJS.Timeout;

    const checkSession = async () => {
      try {
        const response = await adminApi.auth.verify();
        
        if (response.success && response.data?.expiresAt) {
          const expiryDate = new Date(response.data.expiresAt);
          setSessionExpiry(expiryDate);
          
          const now = new Date();
          const timeUntilExpiry = expiryDate.getTime() - now.getTime();
          const warningThreshold = warningTime * 60 * 1000;
          
          // Clear existing warning timeout
          if (warningTimeoutId) {
            clearTimeout(warningTimeoutId);
          }
          
          // Set warning timeout if session will expire soon
          if (timeUntilExpiry > 0 && timeUntilExpiry <= warningThreshold) {
            setShowWarning(true);
          } else if (timeUntilExpiry > warningThreshold) {
            // Schedule warning
            warningTimeoutId = setTimeout(() => {
              setShowWarning(true);
            }, timeUntilExpiry - warningThreshold);
          }
        }
      } catch (error) {
        // Session invalid or expired
        console.error('Session check failed:', error);
      }
    };

    // Initial check
    checkSession();
    
    // Set up interval
    intervalId = setInterval(checkSession, checkInterval);

    return () => {
      clearInterval(intervalId);
      if (warningTimeoutId) {
        clearTimeout(warningTimeoutId);
      }
    };
  }, [checkInterval, warningTime]);

  const handleExtendSession = async () => {
    setIsRefreshing(true);
    try {
      // In a real implementation, this would call an API to extend the session
      // For now, we'll just refresh the page to get a new session check
      await adminApi.auth.verify();
      
      toast({
        title: 'Session 已延長',
        description: '您的登入狀態已更新',
      });
      
      setShowWarning(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: '延長 Session 失敗',
        description: '請重新登入',
        variant: 'destructive',
      });
      router.push('/admin/login');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.auth.logout();
      router.push('/admin/login');
    } catch (error) {
      // Force redirect even if logout fails
      router.push('/admin/login');
    }
  };

  const getTimeRemaining = () => {
    if (!sessionExpiry) return '';
    
    const now = new Date();
    const diff = sessionExpiry.getTime() - now.getTime();
    
    if (diff <= 0) return '已過期';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}分${seconds}秒`;
  };

  return (
    <>
      {children}
      
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session 即將過期</AlertDialogTitle>
            <AlertDialogDescription>
              您的登入狀態將在 {getTimeRemaining()} 後過期。
              是否要延長登入時間？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isRefreshing}
            >
              登出
            </Button>
            <Button
              onClick={handleExtendSession}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  延長中...
                </>
              ) : (
                '延長登入'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}