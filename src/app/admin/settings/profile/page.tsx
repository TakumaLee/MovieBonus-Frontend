// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, Mail, Shield, AlertCircle, Loader2, Check, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminApiError } from '@/lib/api-client-admin';

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const response = await adminApi.profile.get();
      if (response.success && response.data) {
        setUserInfo(response.data);
        setDisplayName(response.data.display_name || response.data.name || '');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      const errorMessage = error instanceof AdminApiError ? error.message : '載入失敗';
      toast({
        title: '載入失敗',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast({
        title: '顯示名稱不能為空',
        variant: 'destructive',
      });
      return;
    }

    setProfileLoading(true);
    try {
      const response = await adminApi.profile.update({ display_name: displayName });
      
      if (response.success && response.data) {
        setUserInfo(response.data);
        setIsEditingProfile(false);
        toast({
          title: '個人資料更新成功',
          description: '您的顯示名稱已更新',
        });
      } else {
        throw new Error(response.error || '更新失敗');
      }
    } catch (error: any) {
      const errorMessage = error instanceof AdminApiError ? error.message : '更新失敗';
      toast({
        title: '更新失敗',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: '密碼不一致',
        description: '新密碼與確認密碼不相符',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: '密碼太短',
        description: '密碼長度至少需要 6 個字元',
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await adminApi.profile.changePassword(currentPassword, newPassword);

      if (response.success) {
        toast({
          title: '密碼更新成功',
          description: '您的密碼已成功更新',
        });

        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(response.error || '密碼更新失敗');
      }
    } catch (error: any) {
      const errorMessage = error instanceof AdminApiError ? error.message : '密碼更新失敗';
      toast({
        title: '更新失敗',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">個人設定</h1>
        <p className="text-muted-foreground">管理您的個人資訊和帳號安全</p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                個人資訊
              </CardTitle>
              <CardDescription>
                您的帳號基本資訊
              </CardDescription>
            </div>
            {!isEditingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                編輯
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingProfile ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">顯示名稱</Label>
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="輸入您的顯示名稱"
                  disabled={profileLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={profileLoading}
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    '儲存變更'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setDisplayName(userInfo?.display_name || userInfo?.name || '');
                  }}
                  disabled={profileLoading}
                >
                  取消
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>顯示名稱</Label>
                  <div className="font-medium text-sm bg-muted px-3 py-2 rounded">
                    {userInfo?.display_name || userInfo?.name || '未設定'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    電子郵件
                  </Label>
                  <div className="font-mono text-sm bg-muted px-3 py-2 rounded">
                    {userInfo?.email || '載入中...'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    角色
                  </Label>
                  <div className="font-medium text-sm bg-muted px-3 py-2 rounded">
                    {userInfo?.role === 'super_admin' ? '超級管理員' : '管理員'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>註冊時間</Label>
                  <div className="text-sm bg-muted px-3 py-2 rounded">
                    {userInfo?.created_at
                      ? new Date(userInfo.created_at).toLocaleString('zh-TW')
                      : '載入中...'}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            變更密碼
          </CardTitle>
          <CardDescription>
            定期更新密碼以保護您的帳號安全
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">目前密碼</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-password">新密碼</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={passwordLoading}
                minLength={6}
              />
              <p className="text-sm text-muted-foreground">
                密碼長度至少需要 6 個字元
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">確認新密碼</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  密碼不一致
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  密碼一致
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新密碼'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>安全提示：</strong>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>使用強密碼，包含大小寫字母、數字和特殊符號</li>
            <li>避免使用與其他網站相同的密碼</li>
            <li>定期更新密碼（建議每 3-6 個月）</li>
            <li>不要與他人分享您的密碼</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}