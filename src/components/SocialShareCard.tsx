/**
 * SocialShareCard — 社群分享特典圖卡
 * 
 * 一鍵生成特典圖卡並分享到 LINE / Facebook / Twitter
 * 支援下載圖片、複製連結
 */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Share2, Download, MessageCircle, Facebook, Twitter, Link2, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { generateSocialShareUrls } from '@/lib/blog-seo-utils';
import { format } from 'date-fns';
import type { MoviePromotion } from '@/lib/types';

interface SocialShareCardProps {
  movie: {
    title: string;
    english_title?: string;
    poster_url?: string;
    release_date?: string;
  };
  bonuses: MoviePromotion[];
  movieUrl: string;
  className?: string;
}

export default function SocialShareCard({ movie, bonuses, movieUrl, className = '' }: SocialShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${movieUrl}`
    : movieUrl;

  const shareText = `🎬 ${movie.title} 有 ${bonuses.length} 個入場特典！快來看看 👉`;
  const shareUrls = generateSocialShareUrls({
    url: fullUrl,
    title: shareText,
    description: `${movie.title} 電影特典速報`,
    hashtags: ['電影特典', '特典速報', movie.title.replace(/\s/g, '')],
  });

  const activeBonuses = bonuses.filter(b => b.is_active);

  const downloadImage = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#1a1a2e',
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `${movie.title}-特典圖卡.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: '圖卡已下載', description: '可直接分享到社群平台' });
    } catch (err) {
      console.error('Generate image error:', err);
      toast({ title: '生成失敗', description: '無法生成圖卡', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [movie.title]);

  const handleShare = useCallback(async (platform: string, url: string) => {
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: shareText, text: shareText, url: fullUrl });
        return;
      } catch { /* user cancelled */ }
    }
    if (platform === 'copy') {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({ title: '連結已複製' });
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    window.open(url, 'share', 'width=600,height=400,scrollbars=yes');
  }, [shareText, fullUrl]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
          <Share2 className="w-4 h-4" />
          分享特典圖卡
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>分享特典圖卡</DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <div
          ref={cardRef}
          className="rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: '24px',
            color: 'white',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {movie.poster_url && (
              <img
                src={movie.poster_url}
                alt={movie.title}
                crossOrigin="anonymous"
                style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
              />
            )}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, lineHeight: 1.3 }}>
                {movie.title}
              </h3>
              {movie.english_title && (
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0' }}>{movie.english_title}</p>
              )}
              {movie.release_date && (
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0' }}>
                  上映：{format(new Date(movie.release_date), 'yyyy/MM/dd')}
                </p>
              )}
              <div style={{
                display: 'inline-block',
                background: '#e94560',
                borderRadius: '12px',
                padding: '2px 10px',
                fontSize: '13px',
                fontWeight: 'bold',
                marginTop: '8px',
              }}>
                🎁 {bonuses.length} 個特典
              </div>
            </div>
          </div>

          {/* Bonus List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bonuses.slice(0, 4).map((bonus, i) => (
              <div
                key={bonus.id || i}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  {bonus.is_active ? '🟢' : '⚪'} {bonus.title}
                </div>
                {bonus.promotion_type && (
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{bonus.promotion_type}</span>
                )}
                {bonus.gifts && bonus.gifts.length > 0 && (
                  <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '8px' }}>
                    🎁 {bonus.gifts.map(g => g.gift_name).join('、')}
                  </span>
                )}
              </div>
            ))}
            {bonuses.length > 4 && (
              <p style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center' }}>
                還有 {bonuses.length - 4} 個特典...
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            opacity: 0.6,
          }}>
            <span>特典速報 MovieBonus</span>
            <span>moviebonus.vercel.app</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={downloadImage} disabled={generating} className="gap-2">
            <Download className="w-4 h-4" />
            {generating ? '生成中...' : '下載圖卡'}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/30"
              onClick={() => handleShare('line', shareUrls.line)}
            >
              <MessageCircle className="w-4 h-4" /> LINE
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border-blue-500/30"
              onClick={() => handleShare('facebook', shareUrls.facebook)}
            >
              <Facebook className="w-4 h-4" /> Facebook
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/30"
              onClick={() => handleShare('twitter', shareUrls.twitter)}
            >
              <Twitter className="w-4 h-4" /> X
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => handleShare('copy', '')}
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {copied ? '已複製' : '複製連結'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
