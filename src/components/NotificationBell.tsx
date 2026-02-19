'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  isPushSupported,
  registerServiceWorker,
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-notifications';

export function NotificationBell() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (!isPushSupported()) return;
      setSupported(true);
      await registerServiceWorker();
      const sub = await getSubscriptionStatus();
      setSubscribed(!!sub);
    };
    init();
  }, []);

  const handleToggle = useCallback(async () => {
    setLoading(true);
    try {
      if (subscribed) {
        const ok = await unsubscribeFromPush();
        if (ok) {
          setSubscribed(false);
          toast({ title: '已取消通知', description: '你將不會再收到新特典通知' });
        }
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({ title: '需要通知權限', description: '請在瀏覽器設定中允許通知', variant: 'destructive' });
          return;
        }
        const ok = await subscribeToPush();
        if (ok) {
          setSubscribed(true);
          toast({ title: '🔔 通知已開啟', description: '有新特典上架時會通知你！' });
        } else {
          toast({ title: '訂閱失敗', description: '請稍後再試', variant: 'destructive' });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [subscribed, toast]);

  if (!supported) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={loading}
            className="relative"
            aria-label={subscribed ? '取消特典通知' : '開啟特典通知'}
          >
            {loading ? (
              <BellRing className="h-5 w-5 animate-pulse" />
            ) : subscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            {subscribed && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{subscribed ? '點擊取消特典通知' : '開啟新特典通知'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
