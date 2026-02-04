/**
 * Scraper 模組入口
 *
 * 前端爬蟲模組，與後端 Python scrapers 互補。
 * 適用於 Vercel serverless 環境（fetch + cheerio，無 Playwright）。
 *
 * 使用方式：
 *   import { scrapeAllTheaters, runNowShowingTracker, detectRerelease } from "@/lib/scraper";
 */

// --- 基礎 fetch 爬蟲 ---
export { fetchPage, fetchPages } from "./fetcher";
export type { FetchOptions, FetchResult } from "./fetcher";

// --- LLM 解析（Anthropic Claude） ---
export {
  buildPrompt,
  parseLLMResponse,
  parseWithLLM,
  BONUS_EXTRACTION_PROMPT,
} from "./llm-parser";

// --- 輕量爬蟲（Vercel 相容，fetch + cheerio）---
export {
  runLightScrape,
  scrapeAllFacebookPages,
  parseFacebookBonuses,
} from "./light-scraper";
export type { LightScrapeResult, FacebookPost } from "./light-scraper";

// --- 影城爬蟲（改進版，含 WAF fallback）---
export { scrapeAllTheaters, THEATER_CONFIGS } from "./theater-scraper";
export type { TheaterScrapeResult, TheaterConfig } from "./theater-scraper";

// --- 重映偵測 ---
export {
  detectRerelease,
  containsRereleaseKeywords,
  buildRereleaseSearchQuery,
  buildSearchQuery,
  checkDateRelevance,
  getFreshnessParam,
  RERELEASE_KEYWORDS,
} from "./rerelease";

// --- 近期上映追蹤（開眼電影網）---
export {
  runNowShowingTracker,
  scrapeNowShowing,
  scrapeUpcoming,
  findMissingMovies,
} from "./now-showing";
export type { NowShowingMovie, NowShowingResult } from "./now-showing";

// --- 共用型別 ---
export type {
  ScrapedMovie,
  ScrapedBonus,
  ScrapeResult,
  LLMParseRequest,
  LLMParseResponse,
} from "./types";
