/**
 * 影城爬蟲 — 爬各影城官網「活動/特典」頁面
 *
 * 使用 cheerio 解析（不用 Playwright，Vercel serverless 相容）
 * 重點影城：威秀 > 秀泰 > 國賓 > 美麗華 > in89
 *
 * 與後端 Python scrapers 互補：
 * - Python backend: 深度爬蟲（Playwright, Facebook, Vieshow API）
 * - 此模組: 輕量爬蟲 + LLM 解析（Vercel cron 可用）
 */

import * as cheerio from "cheerio";
import { fetchPage } from "./fetcher";
import { parseWithLLM } from "./llm-parser";
import type { ScrapedBonus, ScrapeResult } from "./types";

// ============================================================
// 影城設定
// ============================================================

export interface TheaterConfig {
  id: string;
  name: string;
  /** 活動/特典頁面 */
  eventUrls: string[];
  /** 上映中影片頁面 */
  nowShowingUrls: string[];
  enabled: boolean;
  priority: number;
}

export const THEATER_CONFIGS: TheaterConfig[] = [
  {
    id: "vieshow",
    name: "威秀影城",
    eventUrls: [
      "https://www.vscinemas.com.tw/vsweb/film/events.aspx",
    ],
    nowShowingUrls: [
      "https://www.vscinemas.com.tw/vsweb/film/index.aspx",
    ],
    enabled: true,
    priority: 1,
  },
  {
    id: "showtimes",
    name: "秀泰影城",
    eventUrls: [
      "https://www.showtimes.com.tw/events",
    ],
    nowShowingUrls: [
      "https://www.showtimes.com.tw/",
    ],
    enabled: true,
    priority: 2,
  },
  {
    id: "ambassador",
    name: "國賓影城",
    eventUrls: [
      "https://www.ambassador.com.tw/events",
    ],
    nowShowingUrls: [
      "https://www.ambassador.com.tw/",
    ],
    enabled: true,
    priority: 3,
  },
  {
    id: "miramar",
    name: "美麗華影城",
    eventUrls: [
      "https://www.miramarcinemas.tw/",
    ],
    nowShowingUrls: [
      "https://www.miramarcinemas.tw/",
    ],
    enabled: true,
    priority: 4,
  },
  {
    id: "in89",
    name: "in89 豪華數位影城",
    eventUrls: [
      "https://www.in89.com.tw/",
    ],
    nowShowingUrls: [
      "https://www.in89.com.tw/",
    ],
    enabled: true,
    priority: 5,
  },
];

// ============================================================
// 改進版 LLM Prompt（含日期、重映偵測）
// ============================================================

const THEATER_BONUS_PROMPT = `你是一個專門分析台灣電影院特典/入場禮資訊的 AI 助手。

## 任務
分析以下來自「{{theaterName}}」的網頁內容，提取所有電影入場特典（來場者特典/入場禮/購票贈品）資訊。

## 今天日期
{{today}}

## 重要規則
1. 只提取「入場特典」「來場者特典」「購票贈品」「預購特典」，不包含周邊商品販售
2. 每部電影的每個不同特典物品各一筆
3. week 表示第幾週特典（第 1 週、第 2 週...），無法判斷就填 1
4. 如果看不出數量限制，quantity 填 "數量有限，送完為止"
5. 不要編造不存在的資訊
6. 如果沒有特典資訊，回傳空陣列 []
7. **日期過濾**：只提取最近 3 個月內的活動/特典。如果明顯是過期的舊活動，請跳過。
8. **重映電影**：如果是重映/4K修復/IMAX紀念版等，只提取重映版的特典，不要混入原版舊特典。
9. **confidence** (0-1)：對資訊正確性的信心。0.9+ = 官方最新, 0.6-0.8 = 可信, <0.3 = 可能過期
10. **dateRelevance**："recent" = 3個月內, "uncertain" = 不確定, "outdated" = 過期舊文

## 影城
{{theaterName}}（ID: {{theaterId}}）

## 來源
{{sourceUrl}}

## 輸出格式
只輸出 JSON 陣列，不要其他文字：

[
  {
    "movieTitle": "完整電影名稱",
    "theaterName": "{{theaterName}}",
    "week": 1,
    "description": "特典詳細描述，例如：A3 限定海報（IMAX 場次限定）",
    "quantity": "數量說明，例如：購票即贈，數量有限",
    "sourceUrl": "{{sourceUrl}}",
    "confidence": 0.8,
    "dateRelevance": "recent"
  }
]

## 網頁內容
{{html}}
`;

// ============================================================
// HTML 內容提取
// ============================================================

function extractRelevantContent(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, iframe, noscript, header").remove();

  const selectors = [
    '[class*="event"]',
    '[class*="bonus"]',
    '[class*="gift"]',
    '[class*="campaign"]',
    '[class*="activity"]',
    '[class*="news"]',
    '[class*="特典"]',
    '[class*="贈品"]',
    '[class*="活動"]',
    "article",
    ".news-list",
    ".event-list",
    ".film-events",
    ".content-area",
    "main",
    "#content",
  ];

  let relevantHtml = "";
  const seen = new Set<string>();

  for (const selector of selectors) {
    $(selector).each((_i, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 20 && !seen.has(text.slice(0, 100))) {
        seen.add(text.slice(0, 100));
        relevantHtml += text + "\n\n";
      }
    });
  }

  if (!relevantHtml.trim()) {
    relevantHtml = $("body").text().replace(/\s+/g, " ").trim();
  }

  return relevantHtml.slice(0, 8000);
}

// ============================================================
// 單一影城爬蟲
// ============================================================

async function scrapeOneTheater(config: TheaterConfig): Promise<ScrapeResult<ScrapedBonus>> {
  const result: ScrapeResult<ScrapedBonus> = {
    success: false,
    data: [],
    errors: [],
    sourceUrl: config.eventUrls[0] || config.nowShowingUrls[0],
    scrapedAt: new Date().toISOString(),
  };

  if (!config.enabled) {
    result.errors.push(`${config.name} is disabled`);
    return result;
  }

  const allUrls = [...config.eventUrls, ...config.nowShowingUrls];
  const allText: string[] = [];
  let allBlocked = true;

  for (const url of allUrls) {
    console.log(`[Theater Scraper] Fetching ${config.name}: ${url}`);
    try {
      const fetchResult = await fetchPage(url, { timeout: 20000 });
      if (fetchResult.success) {
        allBlocked = false;
        const text = extractRelevantContent(fetchResult.html);
        if (text.length > 50) {
          allText.push(`=== ${config.name} (${url}) ===\n${text}`);
        }
        console.log(`[Theater Scraper] ${config.name} fetched OK, text length: ${text.length}`);
      } else {
        const errMsg = `Failed to fetch ${url}: ${fetchResult.error || `HTTP ${fetchResult.statusCode}`}`;
        result.errors.push(errMsg);
        console.log(`[Theater Scraper] ${errMsg}`);
      }
    } catch (e) {
      const errMsg = `Error fetching ${url}: ${e instanceof Error ? e.message : String(e)}`;
      result.errors.push(errMsg);
      console.error(`[Theater Scraper] ${errMsg}`);
    }
  }

  // WAF fallback: if all direct fetches failed (403 etc.), try Google search
  if (allBlocked && allText.length === 0) {
    console.log(`[Theater Scraper] All URLs blocked for ${config.name}, trying search fallback...`);
    try {
      const searchQuery = `${config.name} 入場特典 ${new Date().getFullYear()}`;
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=zh-TW&tbs=qdr:m3`;
      const searchResult = await fetchPage(googleUrl, {
        timeout: 15000,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
      if (searchResult.success) {
        const text = extractRelevantContent(searchResult.html);
        if (text.length > 50) {
          allText.push(`=== ${config.name} (search fallback) ===\n${text}`);
          console.log(`[Theater Scraper] ${config.name} search fallback OK, text length: ${text.length}`);
        }
      }
    } catch (e) {
      console.error(`[Theater Scraper] ${config.name} search fallback failed:`, e);
    }
  }

  if (allText.length === 0) {
    result.errors.push(`No content fetched for ${config.name}`);
    return result;
  }

  // 檢查 API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`[Theater Scraper] No ANTHROPIC_API_KEY, skipping LLM parse for ${config.name}`);
    result.success = true;
    return result;
  }

  // LLM 解析
  try {
    const combinedText = allText.join("\n\n");
    const promptWithDate = THEATER_BONUS_PROMPT.replace(
      "{{today}}",
      new Date().toISOString().split("T")[0]
    );
    const llmResult = await parseWithLLM({
      html: combinedText,
      sourceUrl: result.sourceUrl,
      theaterId: config.id,
      promptTemplate: promptWithDate,
    });

    result.data = llmResult.bonuses;
    result.success = true;
    console.log(`[Theater Scraper] ${config.name}: found ${result.data.length} bonuses (confidence: ${llmResult.confidence})`);
  } catch (e) {
    const errMsg = `LLM parse error for ${config.name}: ${e instanceof Error ? e.message : String(e)}`;
    result.errors.push(errMsg);
    console.error(`[Theater Scraper] ${errMsg}`);
  }

  return result;
}

// ============================================================
// 主進入點
// ============================================================

export interface TheaterScrapeResult {
  theaters: Record<string, ScrapeResult<ScrapedBonus>>;
  allBonuses: ScrapedBonus[];
  totalBonuses: number;
  errors: string[];
  scrapedAt: string;
}

/**
 * 爬取所有影城的特典資訊
 * 按優先順序依序爬取，附帶 rate limiting
 */
export async function scrapeAllTheaters(): Promise<TheaterScrapeResult> {
  console.log("=== Theater Scraper Start ===");
  console.log("Time:", new Date().toISOString());

  const sorted = [...THEATER_CONFIGS].sort((a, b) => a.priority - b.priority);
  const theaters: Record<string, ScrapeResult<ScrapedBonus>> = {};
  const allBonuses: ScrapedBonus[] = [];
  const allErrors: string[] = [];

  for (const config of sorted) {
    const result = await scrapeOneTheater(config);
    theaters[config.id] = result;
    allBonuses.push(...result.data);
    allErrors.push(...result.errors);

    // Rate limit
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("=== Theater Scraper Complete ===");
  console.log(`Total bonuses: ${allBonuses.length}`);
  console.log(`Total errors: ${allErrors.length}`);

  return {
    theaters,
    allBonuses,
    totalBonuses: allBonuses.length,
    errors: allErrors,
    scrapedAt: new Date().toISOString(),
  };
}
