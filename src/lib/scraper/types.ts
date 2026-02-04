/**
 * Scraper 共用型別定義
 *
 * 這些型別用於前端爬蟲模組，與後端 Python scrapers 互補。
 * 前端爬蟲主要用於：
 * - Vercel Cron 定時抓取
 * - TMDB 整合
 * - 重映偵測
 * - 開眼電影網追蹤
 */

export interface ScrapedMovie {
  title: string;
  titleEn?: string;
  releaseDate?: string;
  duration?: number;
  synopsis?: string;
  sourceUrl: string;
}

export interface ScrapedBonus {
  movieTitle: string;
  theaterName: string;
  week: number;
  description: string;
  quantity: string;
  sourceUrl: string;
  scrapedAt: string; // ISO date string
}

export interface ScrapeResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  sourceUrl: string;
  scrapedAt: string;
}

export interface LLMParseRequest {
  html: string;
  sourceUrl: string;
  theaterId: string;
  promptTemplate: string;
}

export interface LLMParseResponse {
  bonuses: ScrapedBonus[];
  confidence: number; // 0-1
  rawResponse: string;
}
