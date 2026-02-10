// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminApiError } from '@/lib/api-client-admin';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // Get CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const data = await adminApi.auth.getCsrfToken();
        if (data.success && data.csrfToken) {
          setCsrfToken(data.csrfToken);
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
          console.log('CSRF token obtained successfully');
        }
      } catch (err) {
        console.error('Failed to get CSRF token:', err);
        // Don't show error - login can still work without CSRF token
      }
    };
    
    fetchCsrfToken();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Starting login process...', {
        email,
        hasCsrfToken: !!csrfToken,
        hasSessionId: !!sessionId,
        userAgent: navigator.userAgent
      });
      
      // Pass empty strings for CSRF/session if not available
      // Backend will detect and use mobile auth if needed
      const data = await adminApi.auth.login(
        email, 
        password, 
        csrfToken || '', 
        sessionId || ''
      );

      if (data.success) {
        // Handle mobile auth response with token
        if (data.token) {
          console.log('Mobile authentication successful, received token');
          localStorage.setItem('adminToken', data.token);
        }
        
        toast({
          title: '登入成功',
          description: '正在跳轉到管理後台...',
        });
        
        // Check if there's a stored redirect path
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        
        // Redirect to stored path or default to feedbacks page
        router.push(redirectPath || '/admin/feedbacks');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Login error details:', {
        error,
        message: error?.message,
        status: error?.status,
        name: error?.name,
        stack: error?.stack
      });
      
      if (error instanceof AdminApiError) {
        if (error.status === 429) {
          const retryAfter = error.response?.retryAfter;
          setError(error.message + (retryAfter ? ` (請等待 ${retryAfter} 秒)` : ''));
          
          // Disable form for the retry period
          if (retryAfter) {
            const timeout = setTimeout(() => {
              setError('');
            }, retryAfter * 1000);
            return () => clearTimeout(timeout);
          }
        } else if (error.status === 403) {
          setError('請求已過期，正在重新整理...');
          // Get new CSRF token
          try {
            const tokenData = await adminApi.auth.getCsrfToken();
            if (tokenData.success && tokenData.csrfToken) {
              setCsrfToken(tokenData.csrfToken);
              setError('');
              toast({
                title: '請重新嘗試登入',
                description: '安全驗證已更新',
              });
            }
          } catch {
            setError('無法取得安全驗證，請重新整理頁面');
          }
        } else {
          setError(error.message || '登入失敗');
        }
      } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        // Network error
        setError('無法連接到伺服器，請檢查網路連線');
      } else {
        // Unknown error
        setError(`登入失敗: ${error?.message || '未知錯誤'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">管理員登入</CardTitle>
          <CardDescription className="text-center">
            請使用管理員帳號登入
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登入中...
                </>
              ) : (
                '登入'
              )}
            </Button>

            <div className="text-center mt-4">
              <a
                href="/admin/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                忘記密碼？
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}