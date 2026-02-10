// @ts-nocheck
/**
 * Playwright 爬蟲模組 — 用 headless browser 繞過 WAF，抓取各影城特典資訊
 *
 * ⚠️ LOCAL-ONLY：此模組僅供本地開發使用！
 * Vercel serverless 環境不支援 Playwright。
 * 部署時請使用 light-scraper.ts (fetch + cheerio) 替代。
 *
 * 支援影城：
 * - 威秀影城 (vscinemas.com.tw)
 * - 秀泰影城 (showtimes.com.tw)
 * - 國賓影城 (ambassador.com.tw)
 * - 各影城 Facebook 粉絲頁
 *
 * 使用 Playwright chromium headless browser
 */

import { chromium, type Browser, type Page } from "playwright";
import type { ScrapedBonus, ScrapeResult } from "./types";
import { buildPrompt } from "./llm-parser";

// ============================================================
// Browser 管理
// ============================================================

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

async function createPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "zh-TW",
    timezoneId: "Asia/Taipei",
  });
  return context.newPage();
}

// ============================================================
// 共用工具
// ============================================================

interface PageContent {
  url: string;
  title: string;
  textContent: string;
  html: string;
}

async function extractPageContent(
  page: Page,
  url: string,
  options?: { waitSelector?: string; timeout?: number }
): Promise<PageContent> {
  const timeout = options?.timeout ?? 30000;

  await page.goto(url, { waitUntil: "networkidle", timeout });

  if (options?.waitSelector) {
    await page.waitForSelector(options.waitSelector, { timeout: 10000 }).catch(() => {
      console.log(`[Playwright] Selector "${options.waitSelector}" not found, continuing...`);
    });
  }

  const title = await page.title();
  const textContent = await page.evaluate(() => document.body.innerText);
  const html = await page.content();

  return { url: page.url(), title, textContent, html };
}

// ============================================================
// 威秀影城爬蟲
// ============================================================

const VIESHOW_URLS = {
  events: "https://www.vscinemas.com.tw/vsweb/film/events.aspx",
  nowShowing: "https://www.vscinemas.com.tw/vsweb/film/index.aspx",
};

export async function scrapeVieshow(): Promise<ScrapeResult<ScrapedBonus>> {
  const result: ScrapeResult<ScrapedBonus> = {
    success: false,
    data: [],
    errors: [],
    sourceUrl: VIESHOW_URLS.events,
    scrapedAt: new Date().toISOString(),
  };

  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await createPage(browser);

    // 1. 抓活動頁
    console.log("[Vieshow] Scraping events page...");
    const eventsContent = await extractPageContent(page, VIESHOW_URLS.events, {
      waitSelector: ".event-list, .news-list, .main-content",
    });

    // 2. 抓現正上映頁（有時特典資訊在這）
    console.log("[Vieshow] Scraping now-showing page...");
    const nowShowingContent = await extractPageContent(page, VIESHOW_URLS.nowShowing, {
      waitSelector: ".film-list, .movie-list, .main-content",
    });

    // 3. 合併內容，用 LLM 解析
    const combinedHtml = `
      <h2>===== 威秀影城 活動頁 =====</h2>
      ${eventsContent.textContent}
      <h2>===== 威秀影城 現正上映 =====</h2>
      ${nowShowingContent.textContent}
    `;

    const llmResult = await parseWithLLMMock(combinedHtml, "vieshow", VIESHOW_URLS.events);
    result.data = llmResult;
    result.success = true;

    console.log(`[Vieshow] Scraped ${result.data.length} bonuses`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Vieshow scrape error: ${msg}`);
    console.error("[Vieshow] Error:", msg);
  } finally {
    if (page) await page.context().close();
  }

  return result;
}

// ============================================================
// 秀泰影城爬蟲
// ============================================================

const SHOWTIMES_URLS = {
  events: "https://www.showtimes.com.tw/events",
  nowShowing: "https://www.showtimes.com.tw/movieList",
};

export async function scrapeShowtimes(): Promise<ScrapeResult<ScrapedBonus>> {
  const result: ScrapeResult<ScrapedBonus> = {
    success: false,
    data: [],
    errors: [],
    sourceUrl: SHOWTIMES_URLS.events,
    scrapedAt: new Date().toISOString(),
  };

  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await createPage(browser);

    console.log("[Showtimes] Scraping events page...");
    const eventsContent = await extractPageContent(page, SHOWTIMES_URLS.events, {
      waitSelector: ".event-card, .news-item, .content-area",
    });

    console.log("[Showtimes] Scraping movie list...");
    const movieContent = await extractPageContent(page, SHOWTIMES_URLS.nowShowing, {
      waitSelector: ".movie-card, .film-item, .movie-list",
    });

    const combinedHtml = `
      <h2>===== 秀泰影城 活動頁 =====</h2>
      ${eventsContent.textContent}
      <h2>===== 秀泰影城 電影列表 =====</h2>
      ${movieContent.textContent}
    `;

    const llmResult = await parseWithLLMMock(combinedHtml, "showtimes", SHOWTIMES_URLS.events);
    result.data = llmResult;
    result.success = true;

    console.log(`[Showtimes] Scraped ${result.data.length} bonuses`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Showtimes scrape error: ${msg}`);
    console.error("[Showtimes] Error:", msg);
  } finally {
    if (page) await page.context().close();
  }

  return result;
}

// ============================================================
// 國賓影城爬蟲
// ============================================================

const AMBASSADOR_URLS = {
  events: "https://www.ambassador.com.tw/events",
  nowShowing: "https://www.ambassador.com.tw/showtime",
};

export async function scrapeAmbassador(): Promise<ScrapeResult<ScrapedBonus>> {
  const result: ScrapeResult<ScrapedBonus> = {
    success: false,
    data: [],
    errors: [],
    sourceUrl: AMBASSADOR_URLS.events,
    scrapedAt: new Date().toISOString(),
  };

  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await createPage(browser);

    console.log("[Ambassador] Scraping events page...");
    const eventsContent = await extractPageContent(page, AMBASSADOR_URLS.events, {
      waitSelector: ".event-list, .news-list, .content",
    });

    console.log("[Ambassador] Scraping now-showing page...");
    const movieContent = await extractPageContent(page, AMBASSADOR_URLS.nowShowing, {
      waitSelector: ".movie-list, .film-list, .content",
    });

    const combinedHtml = `
      <h2>===== 國賓影城 活動頁 =====</h2>
      ${eventsContent.textContent}
      <h2>===== 國賓影城 電影列表 =====</h2>
      ${movieContent.textContent}
    `;

    const llmResult = await parseWithLLMMock(combinedHtml, "ambassador", AMBASSADOR_URLS.events);
    result.data = llmResult;
    result.success = true;

    console.log(`[Ambassador] Scraped ${result.data.length} bonuses`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Ambassador scrape error: ${msg}`);
    console.error("[Ambassador] Error:", msg);
  } finally {
    if (page) await page.context().close();
  }

  return result;
}

// ============================================================
// Facebook 粉絲頁爬蟲
// ============================================================

const FB_PAGES = {
  vieshow: "https://www.facebook.com/vscinemas",
  showtimes: "https://www.facebook.com/showtimescinemas",
  ambassador: "https://www.facebook.com/ambassadortheaters",
};

export interface FacebookPost {
  theaterId: string;
  text: string;
  timestamp?: string;
  url: string;
}

/**
 * 爬取 Facebook 粉絲頁最新貼文
 *
 * 注意：Facebook 對未登入用戶有嚴格限制，可能需要：
 * 1. 使用 mbasic.facebook.com (輕量版)
 * 2. 處理登入牆
 * 3. 使用存檔的 cookie
 *
 * 目前實作使用 mbasic 版本，較容易抓取
 */
export async function scrapeFacebookPosts(
  theaterId: string,
  maxPosts: number = 5
): Promise<FacebookPost[]> {
  const fbUrl = FB_PAGES[theaterId as keyof typeof FB_PAGES];
  if (!fbUrl) {
    console.log(`[Facebook] No FB page configured for theater: ${theaterId}`);
    return [];
  }

  // 使用 mbasic 版本，較少 JS 依賴
  const mbasicUrl = fbUrl.replace("www.facebook.com", "mbasic.facebook.com");
  const posts: FacebookPost[] = [];
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await createPage(browser);

    console.log(`[Facebook] Scraping ${theaterId} page: ${mbasicUrl}`);
    await page.goto(mbasicUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // mbasic.facebook.com 的貼文結構較簡單
    // 每則貼文通常在 <article> 或 div.story_body_container 裡
    const postElements = await page.$$("article, div[data-ft], div.story_body_container");

    for (let i = 0; i < Math.min(postElements.length, maxPosts); i++) {
      try {
        const text = await postElements[i].innerText();
        if (text && text.trim().length > 10) {
          posts.push({
            theaterId,
            text: text.trim().slice(0, 2000), // 限制長度
            url: mbasicUrl,
          });
        }
      } catch {
        // skip failed elements
      }
    }

    console.log(`[Facebook] Got ${posts.length} posts for ${theaterId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Facebook] Error scraping ${theaterId}:`, msg);
  } finally {
    if (page) await page.context().close();
  }

  return posts;
}

/**
 * 爬取所有影城的 Facebook 貼文
 */
export async function scrapeAllFacebookPosts(): Promise<FacebookPost[]> {
  const allPosts: FacebookPost[] = [];

  for (const theaterId of Object.keys(FB_PAGES)) {
    const posts = await scrapeFacebookPosts(theaterId);
    allPosts.push(...posts);
    // Rate limit between theaters
    await new Promise((r) => setTimeout(r, 2000));
  }

  return allPosts;
}

// ============================================================
// LLM 解析 (Mock / Placeholder)
// ============================================================

/**
 * 🚧 MOCK LLM 解析函式
 *
 * TODO: 接入真正的 LLM API (OpenAI / Anthropic)
 *
 * 目前行為：
 * 1. 建立完整的 prompt（含爬到的 HTML 內容）
 * 2. 印出 prompt 長度供除錯
 * 3. 回傳空結果（等接入 LLM 後就能自動解析）
 *
 * 接入方式：
 * ```typescript
 * // 替換此函式的實作：
 * import Anthropic from "@anthropic-ai/sdk";
 * const client = new Anthropic();
 * const message = await client.messages.create({
 *   model: "claude-sonnet-4-20250514",
 *   max_tokens: 2048,
 *   messages: [{ role: "user", content: prompt }],
 * });
 * return parseLLMResponse(message.content[0].text, sourceUrl);
 * ```
 */
async function parseWithLLMMock(
  html: string,
  theaterId: string,
  sourceUrl: string
): Promise<ScrapedBonus[]> {
  const prompt = buildPrompt({
    html,
    sourceUrl,
    theaterId,
    promptTemplate: "", // 使用預設 template
  });

  console.log(`[LLM Mock] Prompt built for ${theaterId}, length: ${prompt.length} chars`);
  console.log(`[LLM Mock] ⚠️ LLM API not yet connected — returning empty results`);
  console.log(`[LLM Mock] To enable: set ANTHROPIC_API_KEY or OPENAI_API_KEY env var`);

  // 回傳空結果 — 接入 LLM 後這裡會回傳真正的解析結果
  return [];
}

// ============================================================
// Facebook 貼文特典解析 (Mock)
// ============================================================

/**
 * 🚧 MOCK: 從 Facebook 貼文中解析特典資訊
 *
 * TODO: 接入 LLM API 後實作
 */
export async function parseFacebookPostsForBonuses(
  posts: FacebookPost[]
): Promise<ScrapedBonus[]> {
  if (posts.length === 0) return [];

  const combinedText = posts
    .map((p) => `[${p.theaterId}] ${p.text}`)
    .join("\n\n---\n\n");

  console.log(`[LLM Mock] Would parse ${posts.length} Facebook posts (${combinedText.length} chars)`);
  console.log(`[LLM Mock] ⚠️ LLM API not yet connected — returning empty results`);

  return [];
}

// ============================================================
// 主進入點：執行完整爬蟲
// ============================================================

export interface FullScrapeResult {
  vieshow: ScrapeResult<ScrapedBonus>;
  showtimes: ScrapeResult<ScrapedBonus>;
  ambassador: ScrapeResult<ScrapedBonus>;
  facebookPosts: FacebookPost[];
  facebookBonuses: ScrapedBonus[];
  totalBonuses: number;
  scrapedAt: string;
}

/**
 * 執行所有影城的 Playwright 爬蟲
 */
export async function runFullScrape(): Promise<FullScrapeResult> {
  console.log("=== MovieBonus Playwright Full Scrape ===");
  console.log("Start time:", new Date().toISOString());

  const [vieshow, showtimes, ambassador] = await Promise.all([
    scrapeVieshow(),
    scrapeShowtimes(),
    scrapeAmbassador(),
  ]);

  // Facebook 爬蟲（依序執行，避免被擋）
  const facebookPosts = await scrapeAllFacebookPosts();
  const facebookBonuses = await parseFacebookPostsForBonuses(facebookPosts);

  const totalBonuses =
    vieshow.data.length +
    showtimes.data.length +
    ambassador.data.length +
    facebookBonuses.length;

  console.log("=== Scrape Complete ===");
  console.log(`Total bonuses found: ${totalBonuses}`);
  console.log(`Facebook posts collected: ${facebookPosts.length}`);

  await closeBrowser();

  return {
    vieshow,
    showtimes,
    ambassador,
    facebookPosts,
    facebookBonuses,
    totalBonuses,
    scrapedAt: new Date().toISOString(),
  };
}
