'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, X, Send, Gift, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/gtag';

// ============================================================================
// Types
// ============================================================================

interface FeedbackFormData {
  type: string;
  title: string;
  content: string;
  email: string;
  name: string;
  honeypot: string;
}

interface BonusFormData {
  movieTitle: string;
  movieEnglishTitle: string;
  cinemaName: string;
  bonusType: string;
  bonusName: string;
  bonusDescription: string;
  acquisitionMethod: string;
  activityPeriodStart: string;
  activityPeriodEnd: string;
  quantityLimit: string;
  sourceType: string;
  sourceUrl: string;
  sourceDescription: string;
}

// ============================================================================
// Constants
// ============================================================================

const FEEDBACK_TYPES = [
  { value: 'bonus_completion', label: '特典補完', description: '回報新的電影特典資訊或補充遺漏的特典資料' },
  { value: 'suggestion', label: '意見建議', description: '對網站功能或服務的改進建議' },
  { value: 'data_correction', label: '資料修正', description: '回報錯誤的電影或特典資訊' },
];

const BONUS_TYPES = [
  '首週購票禮', '預售禮', '會員禮', '限定版商品', '電影周邊',
  '特映會贈品', '合作活動', '其他',
];

const CINEMA_NAMES = [
  '威秀影城', '國賓大戲院', '秀泰影城', '美麗華大直影城',
  '新光影城', '華納威秀', '其他',
];

const SOURCE_TYPES = [
  { value: 'official_website', label: '官方網站' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'on_site', label: '現場海報/公告' },
  { value: 'other', label: '其他' },
];

// Rate limiting
const RATE_LIMIT_KEY = 'feedback_submissions';
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

interface SubmissionRecord {
  timestamp: number;
}

// ============================================================================
// Helpers
// ============================================================================

function checkRateLimit(): boolean {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const submissions: SubmissionRecord[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    const recent = submissions.filter((s) => now - s.timestamp < RATE_LIMIT_WINDOW);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
    return recent.length < RATE_LIMIT_COUNT;
  } catch {
    return true;
  }
}

function recordSubmission(): void {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const submissions: SubmissionRecord[] = stored ? JSON.parse(stored) : [];
    submissions.push({ timestamp: Date.now() });
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(submissions));
  } catch {
    // ignore
  }
}

const INITIAL_FORM: FeedbackFormData = {
  type: '',
  title: '',
  content: '',
  email: '',
  name: '',
  honeypot: '',
};

const INITIAL_BONUS: BonusFormData = {
  movieTitle: '',
  movieEnglishTitle: '',
  cinemaName: '',
  bonusType: '',
  bonusName: '',
  bonusDescription: '',
  acquisitionMethod: '',
  activityPeriodStart: '',
  activityPeriodEnd: '',
  quantityLimit: '',
  sourceType: '',
  sourceUrl: '',
  sourceDescription: '',
};

// ============================================================================
// Component
// ============================================================================

export default function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeedbackFormData>(INITIAL_FORM);
  const [bonusData, setBonusData] = useState<BonusFormData>(INITIAL_BONUS);
  const { toast } = useToast();

  const showBonusForm = formData.type === 'bonus_completion';
  const selectedType = FEEDBACK_TYPES.find((t) => t.value === formData.type);

  // ------ validation ------

  const validateStep1 = (): boolean => {
    if (!formData.type) {
      toast({ title: '❗ 錯誤', description: '請選擇回饋類型', variant: 'destructive' });
      return false;
    }
    if (!formData.content.trim()) {
      toast({ title: '❗ 錯誤', description: '請填寫回饋內容', variant: 'destructive' });
      return false;
    }
    if (formData.honeypot) {
      toast({ title: '❗ 錯誤', description: '表單驗證失敗', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (showBonusForm) {
      if (!bonusData.movieTitle.trim()) {
        toast({ title: '❗ 錯誤', description: '請填寫電影名稱', variant: 'destructive' });
        return false;
      }
      if (!bonusData.bonusName.trim()) {
        toast({ title: '❗ 錯誤', description: '請填寫特典名稱', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  // ------ submit ------

  const handleSubmit = async () => {
    if (!validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (!checkRateLimit()) {
      toast({
        title: '⏱️ 提交限制',
        description: '您的提交過於頻繁，請稍後再試（每小時限制 3 次）',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData = {
        feedback_type: formData.type,
        title: formData.title || undefined,
        content: formData.content,
        contact_email: formData.email || undefined,
        contact_name: formData.name || undefined,
        honeypot: formData.honeypot,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer_url: typeof document !== 'undefined' ? document.referrer : undefined,
      };

      let bonusDetails: Record<string, string | undefined> | undefined;
      if (showBonusForm) {
        bonusDetails = {
          movie_title: bonusData.movieTitle,
          movie_english_title: bonusData.movieEnglishTitle || undefined,
          cinema_name: bonusData.cinemaName || undefined,
          bonus_type: bonusData.bonusType || undefined,
          bonus_name: bonusData.bonusName,
          bonus_description: bonusData.bonusDescription || undefined,
          acquisition_method: bonusData.acquisitionMethod || undefined,
          activity_period_start: bonusData.activityPeriodStart || undefined,
          activity_period_end: bonusData.activityPeriodEnd || undefined,
          quantity_limit: bonusData.quantityLimit || undefined,
          source_type: bonusData.sourceType || undefined,
          source_url: bonusData.sourceUrl || undefined,
          source_description: bonusData.sourceDescription || undefined,
        };
      }

      const res = await fetch('/api/feedback/user-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackData, bonusDetails }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        trackEvent.feedbackSubmit(formData.type);
        recordSubmission();
        setSubmissionId(result.submission_id ?? result.feedback_id ?? null);

        toast({
          title: '✅ 回饋已送出',
          description: '感謝您的寶貴意見！我們會盡快處理。',
          duration: 5000,
        });

        setFormData(INITIAL_FORM);
        setBonusData(INITIAL_BONUS);
      } else {
        toast({
          title: '❌ 發送失敗',
          description: result.error || '提交過程中發生錯誤',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: '❌ 網路錯誤',
        description: '無法連接到伺服器，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------ handlers ------

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBonusChange = (field: keyof BonusFormData, value: string) => {
    setBonusData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSubmissionId(null);
    setIsOpen(false);
  };

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [isOpen]);

  // ------ render ------

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          aria-label="開啟回饋表單"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="shadow-2xl border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-accent" />
                      <CardTitle className="text-lg">
                        {submissionId ? '提交成功' : '使用者回饋'}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {!submissionId && showBonusForm && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`h-2 w-2 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                      <div className={`h-2 w-2 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                      <span className="text-sm text-muted-foreground ml-2">步驟 {currentStep} / 2</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  {/* ---- Success State ---- */}
                  {submissionId ? (
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">回饋已成功提交！</h3>
                        <p className="text-muted-foreground mt-2">感謝您的回饋！我們會盡快處理。</p>
                        <div className="bg-muted/50 rounded-lg p-3 mt-4">
                          <p className="text-sm">
                            <strong>提交編號：</strong>
                            <code className="bg-background px-2 py-1 rounded ml-2">{submissionId}</code>
                          </p>
                        </div>
                      </div>
                      <Button onClick={resetForm} className="w-full">關閉</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* ---- Step 1 ---- */}
                      {currentStep === 1 && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="feedback-type">回饋類型 *</Label>
                            <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="選擇回饋類型" />
                              </SelectTrigger>
                              <SelectContent>
                                {FEEDBACK_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    <div>
                                      <div className="font-medium">{t.label}</div>
                                      <div className="text-xs text-muted-foreground">{t.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="feedback-title">標題 (可選)</Label>
                            <Input
                              id="feedback-title"
                              placeholder="簡短描述您的回饋"
                              value={formData.title}
                              onChange={(e) => handleInputChange('title', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="feedback-content">
                              詳細內容 *
                              {selectedType && (
                                <span className="text-sm text-muted-foreground ml-2">— {selectedType.description}</span>
                              )}
                            </Label>
                            <Textarea
                              id="feedback-content"
                              placeholder={
                                formData.type === 'bonus_completion'
                                  ? '請簡述您要回報的特典資訊，詳細資料請在下一步填寫...'
                                  : formData.type === 'suggestion'
                                    ? '請詳細說明您的建議...'
                                    : formData.type === 'data_correction'
                                      ? '請說明需要修正的內容...'
                                      : '請輸入您的回饋內容...'
                              }
                              value={formData.content}
                              onChange={(e) => handleInputChange('content', e.target.value)}
                              rows={4}
                              className="resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="feedback-name">姓名 (可選)</Label>
                              <Input
                                id="feedback-name"
                                placeholder="您的姓名"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="feedback-email">聯絡信箱 (可選)</Label>
                              <Input
                                id="feedback-email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Honeypot */}
                          <input
                            type="text"
                            style={{ display: 'none' }}
                            value={formData.honeypot}
                            onChange={(e) => handleInputChange('honeypot', e.target.value)}
                            tabIndex={-1}
                            autoComplete="off"
                          />

                          <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                              取消
                            </Button>
                            {showBonusForm ? (
                              <Button type="button" onClick={() => validateStep1() && setCurrentStep(2)} className="flex-1">
                                下一步：特典詳情
                              </Button>
                            ) : (
                              <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />提交中...</>
                                ) : (
                                  <><Send className="w-4 h-4 mr-2" />提交回饋</>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ---- Step 2: Bonus Details ---- */}
                      {currentStep === 2 && showBonusForm && (
                        <div className="space-y-4">
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                            <h3 className="font-medium mb-1">特典補完詳細資料</h3>
                            <p className="text-sm text-muted-foreground">
                              請盡可能詳細填寫，這將幫助我們更準確地收錄特典資訊。
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="movie-title">電影名稱 *</Label>
                              <Input
                                id="movie-title"
                                placeholder="例如：全知讀者視角"
                                value={bonusData.movieTitle}
                                onChange={(e) => handleBonusChange('movieTitle', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="movie-english-title">英文名稱 (可選)</Label>
                              <Input
                                id="movie-english-title"
                                placeholder="例如：Omniscient Reader"
                                value={bonusData.movieEnglishTitle}
                                onChange={(e) => handleBonusChange('movieEnglishTitle', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>影城名稱</Label>
                              <Select value={bonusData.cinemaName} onValueChange={(v) => handleBonusChange('cinemaName', v)}>
                                <SelectTrigger><SelectValue placeholder="選擇影城" /></SelectTrigger>
                                <SelectContent>
                                  {CINEMA_NAMES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>特典類型</Label>
                              <Select value={bonusData.bonusType} onValueChange={(v) => handleBonusChange('bonusType', v)}>
                                <SelectTrigger><SelectValue placeholder="選擇特典類型" /></SelectTrigger>
                                <SelectContent>
                                  {BONUS_TYPES.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bonus-name">特典名稱 *</Label>
                            <Input
                              id="bonus-name"
                              placeholder="例如：限定小卡一組"
                              value={bonusData.bonusName}
                              onChange={(e) => handleBonusChange('bonusName', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bonus-description">特典描述</Label>
                            <Textarea
                              id="bonus-description"
                              placeholder="詳細描述特典內容、材質、尺寸等"
                              value={bonusData.bonusDescription}
                              onChange={(e) => handleBonusChange('bonusDescription', e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="acquisition-method">取得方式</Label>
                            <Textarea
                              id="acquisition-method"
                              placeholder="例如：購買任一場次電影票即可兌換，每人限兌一個"
                              value={bonusData.acquisitionMethod}
                              onChange={(e) => handleBonusChange('acquisitionMethod', e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="period-start">活動開始日期</Label>
                              <Input
                                id="period-start"
                                type="date"
                                value={bonusData.activityPeriodStart}
                                onChange={(e) => handleBonusChange('activityPeriodStart', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="period-end">活動結束日期</Label>
                              <Input
                                id="period-end"
                                type="date"
                                value={bonusData.activityPeriodEnd}
                                onChange={(e) => handleBonusChange('activityPeriodEnd', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="quantity-limit">數量限制</Label>
                            <Input
                              id="quantity-limit"
                              placeholder="例如：每人限兌1個，數量有限送完為止"
                              value={bonusData.quantityLimit}
                              onChange={(e) => handleBonusChange('quantityLimit', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>資料來源</Label>
                              <Select value={bonusData.sourceType} onValueChange={(v) => handleBonusChange('sourceType', v)}>
                                <SelectTrigger><SelectValue placeholder="選擇來源類型" /></SelectTrigger>
                                <SelectContent>
                                  {SOURCE_TYPES.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="source-url">來源網址</Label>
                              <Input
                                id="source-url"
                                type="url"
                                placeholder="https://..."
                                value={bonusData.sourceUrl}
                                onChange={(e) => handleBonusChange('sourceUrl', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="source-description">來源說明</Label>
                            <Textarea
                              id="source-description"
                              placeholder="例如：威秀影城官方 Facebook 貼文、現場海報拍照等"
                              value={bonusData.sourceDescription}
                              onChange={(e) => handleBonusChange('sourceDescription', e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                              上一步
                            </Button>
                            <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                              {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />提交中...</>
                              ) : (
                                <><Send className="w-4 h-4 mr-2" />提交特典補完</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
