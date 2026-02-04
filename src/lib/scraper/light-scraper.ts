/**
 * 輕量爬蟲 — 使用 fetch + cheerio，適合 Vercel serverless 部署
 *
 * 包含：影城官網爬蟲、Facebook mbasic 爬蟲、開眼電影網爬蟲
 * 特色：WAF fallback（403→Google 搜尋）+ 日期二次驗證
 */

import * as cheerio from "cheerio";
import { fetchPage } from "./fetcher";
import { parseWithLLM, BONUS_EXTRACTION_PROMPT } from "./llm-parser";
import { checkDateRelevance } from "./rerelease";
import type { ScrapedBonus, ScrapeResult } from "./types";

// ============================================================
// 影城爬蟲設定
// ============================================================

interface TheaterScrapeConfig {
  id: string;
  name: string;
  urls: string[];
  enabled: boolean;
}

const THEATER_CONFIGS: TheaterScrapeConfig[] = [
  {
    id: "vieshow",
    name: "威秀影城",
    urls: [
      "https://www.vscinemas.com.tw/vsweb/film/events.aspx",
      "https://www.vscinemas.com.tw/vsweb/film/index.aspx",
    ],
    enabled: true,
  },
  {
    id: "showtimes",
    name: "秀泰影城",
    urls: ["https://www.showtimes.com.tw/events"],
    enabled: true,
  },
  {
    id: "ambassador",
    name: "國賓影城",
    urls: ["https://www.ambassador.com.tw/events"],
    enabled: true,
  },
  {
    id: "miramar",
    name: "美麗華影城",
    urls: ["https://www.miramarcinemas.tw/"],
    enabled: true,
  },
  {
    id: "in89",
    name: "in89 豪華數位影城",
    urls: ["https://www.in89.com.tw/"],
    enabled: true,
  },
];

// Facebook 粉絲頁（mbasic 版本）
const FB_PAGES: Record<string, string> = {
  vieshow: "https://mbasic.facebook.com/vscinemas",
  showtimes: "https://mbasic.facebook.com/showtimescinemas",
  ambassador: "https://mbasic.facebook.com/ambassadortheaters",
  miramar: "https://mbasic.facebook.com/maboroshi.miramar",
  in89: "https://mbasic.facebook.com/in89cinemas",
};

// ============================================================
// HTML 清理
// ============================================================

function extractBonusRelatedHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, iframe, noscript").remove();

  const selectors = [
    '[class*="event"]',
    '[class*="bonus"]',
    '[class*="gift"]',
    '[class*="特典"]',
    '[class*="贈品"]',
    "article",
    ".news-list",
    ".event-list",
  ];

  let relevantHtml = "";
  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      relevantHtml += elements.text() + "\n";
    }
  }

  if (!relevantHtml.trim()) {
    const mainContent =
      $("main, .main-content, .content, #content, article").text() ||
      $("body").text();
    relevantHtml = mainContent.replace(/\s+/g, " ").trim();
  }

  return relevantHtml.slice(0, 6000);
}

// ============================================================
// 單一影城爬蟲（含 WAF fallback）
// ============================================================

async function scrapeTheater(
  config: TheaterScrapeConfig
): Promise<ScrapeResult<ScrapedBonus>> {
  const result: ScrapeResult<ScrapedBonus> = {
    success: false,
    data: [],
    errors: [],
    sourceUrl: config.urls[0],
    scrapedAt: new Date().toISOString(),
  };

  if (!config.enabled) {
    result.errors.push(`${config.name} scraper is disabled`);
    return result;
  }

  try {
    const allText: string[] = [];
    let allBlocked = true;

    for (const url of config.urls) {
      console.log(`[Light Scraper] Fetching ${config.name}: ${url}`);
      const fetchResult = await fetchPage(url, { timeout: 20000 });

      if (fetchResult.success) {
        allBlocked = false;
        const text = extractBonusRelatedHtml(fetchResult.html);
        allText.push(`===== ${config.name} (${url}) =====\n${text}`);
      } else {
        result.errors.push(
          `Failed to fetch ${url}: ${fetchResult.error || "Unknown error"}`
        );
      }
    }

    // WAF fallback: if all direct fetches failed, try search engine
    if (allBlocked && allText.length === 0) {
      console.log(`[Light Scraper] All URLs blocked for ${config.name}, trying search fallback...`);
      try {
        const searchQuery = `${config.name} 入場特典 ${new Date().getFullYear()}`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=zh-TW&tbs=qdr:m3`;
        const searchResult = await fetchPage(googleUrl, { timeout: 15000 });
        if (searchResult.success) {
          const text = extractBonusRelatedHtml(searchResult.html);
          if (text.length > 50) {
            allText.push(`===== ${config.name} (search fallback) =====\n${text}`);
          }
        }
      } catch (e) {
        console.error(`[Light Scraper] ${config.name} search fallback failed:`, e);
      }
    }

    if (allText.length === 0) {
      result.errors.push(`No pages fetched for ${config.name}`);
      return result;
    }

    // 用 LLM 解析
    const combinedText = allText.join("\n\n");

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(
        `[Light Scraper] No ANTHROPIC_API_KEY, skipping LLM parse for ${config.name}`
      );
      result.success = true;
      return result;
    }

    const llmResult = await parseWithLLM({
      html: combinedText,
      sourceUrl: config.urls[0],
      theaterId: config.id,
      promptTemplate: BONUS_EXTRACTION_PROMPT,
    });

    // Post-LLM date filtering: discard bonuses from outdated content
    result.data = llmResult.bonuses.filter((bonus) => {
      const { isRecent } = checkDateRelevance(
        `${bonus.description} ${bonus.quantity}`,
        3
      );
      return isRecent;
    });
    result.success = true;

    console.log(
      `[Light Scraper] ${config.name}: found ${result.data.length} bonuses (confidence: ${llmResult.confidence})`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`${config.name} scrape error: ${msg}`);
    console.error(`[Light Scraper] ${config.name} error:`, msg);
  }

  return result;
}

// ============================================================
// Facebook 粉絲頁爬蟲
// ============================================================

export interface FacebookPost {
  theaterId: string;
  theaterName: string;
  text: string;
  url: string;
  scrapedAt: string;
}

async function scrapeFacebookPage(
  theaterId: string,
  maxPosts: number = 3
): Promise<FacebookPost[]> {
  const fbUrl = FB_PAGES[theaterId];
  if (!fbUrl) return [];

  const theaterName =
    THEATER_CONFIGS.find((c) => c.id === theaterId)?.name ?? theaterId;
  const posts: FacebookPost[] = [];

  try {
    console.log(`[FB Scraper] Fetching ${theaterName}: ${fbUrl}`);
    const result = await fetchPage(fbUrl, {
      timeout: 15000,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });

    if (!result.success) {
      console.log(`[FB Scraper] Failed to fetch ${theaterName}: ${result.error}`);
      return [];
    }

    const $ = cheerio.load(result.html);

    const postSelectors = [
      "article",
      'div[role="article"]',
      "#recent .bx",
      "#recent article",
      ".story_body_container",
    ];

    let elements: ReturnType<typeof $> | null = null;
    for (const sel of postSelectors) {
      const found = $(sel);
      if (found.length > 0) {
        elements = found;
        break;
      }
    }

    if (!elements || elements.length === 0) {
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();
      if (bodyText.length > 100) {
        posts.push({
          theaterId,
          theaterName,
          text: bodyText.slice(0, 2000),
          url: fbUrl,
          scrapedAt: new Date().toISOString(),
        });
      }
      return posts;
    }

    elements.each((i, el) => {
      if (i >= maxPosts) return false;
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 20) {
        posts.push({
          theaterId,
          theaterName,
          text: text.slice(0, 2000),
          url: fbUrl,
          scrapedAt: new Date().toISOString(),
        });
      }
    });

    console.log(`[FB Scraper] ${theaterName}: got ${posts.length} posts`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FB Scraper] ${theaterName} error:`, msg);
  }

  return posts;
}

/**
 * 爬取所有影城 Facebook 粉絲頁
 */
export async function scrapeAllFacebookPages(): Promise<FacebookPost[]> {
  const allPosts: FacebookPost[] = [];

  for (const theaterId of Object.keys(FB_PAGES)) {
    const posts = await scrapeFacebookPage(theaterId);
    allPosts.push(...posts);
    await new Promise((r) => setTimeout(r, 2000));
  }

  return allPosts;
}

/**
 * 用 LLM 解析 Facebook 貼文中的特典資訊
 */
export async function parseFacebookBonuses(
  posts: FacebookPost[]
): Promise<ScrapedBonus[]> {
  if (posts.length === 0 || !process.env.ANTHROPIC_API_KEY) return [];

  const combinedText = posts
    .map((p) => `[${p.theaterName}]\n${p.text}`)
    .join("\n\n---\n\n");

  try {
    const result = await parseWithLLM({
      html: combinedText,
      sourceUrl: "facebook.com (mbasic)",
      theaterId: "facebook-combined",
      promptTemplate: BONUS_EXTRACTION_PROMPT,
    });
    return result.bonuses;
  } catch (err) {
    console.error("[FB Scraper] LLM parse error:", err);
    return [];
  }
}

// ============================================================
// atmovies 電影列表爬蟲（備用資料來源）
// ============================================================

const ATMOVIES_URL = "https://www.atmovies.com.tw/movie/now/";

export interface AtmoviesMovie {
  title: string;
  releaseDate: string;
  url: string;
}

export async function scrapeAtmoviesNowShowing(): Promise<AtmoviesMovie[]> {
  const result = await fetchPage(ATMOVIES_URL, { timeout: 15000 });
  if (!result.success) {
    console.error(
      `[Light Scraper] Failed to fetch atmovies: ${result.error}`
    );
    return [];
  }

  const $ = cheerio.load(result.html);
  const movies: AtmoviesMovie[] = [];

  $("ul.filmList li, .filmListAll li, .at0 li").each((_i, el) => {
    const titleEl = $(el).find("a").first();
    const title = titleEl.text().trim();
    const href = titleEl.attr("href") || "";
    const dateText = $(el).find(".runtime, .date, span").text().trim();

    if (title) {
      movies.push({
        title,
        releaseDate: dateText || "",
        url: href.startsWith("http")
          ? href
          : `https://www.atmovies.com.tw${href}`,
      });
    }
  });

  console.log(
    `[Light Scraper] atmovies: found ${movies.length} now-showing movies`
  );
  return movies;
}

// ============================================================
// 主進入點
// ============================================================

export interface LightScrapeResult {
  theaters: Record<string, ScrapeResult<ScrapedBonus>>;
  facebookPosts: FacebookPost[];
  facebookBonuses: ScrapedBonus[];
  allBonuses: ScrapedBonus[];
  totalBonuses: number;
  errors: string[];
  scrapedAt: string;
}

export async function runLightScrape(): Promise<LightScrapeResult> {
  console.log("=== MovieBonus Light Scrape (fetch + cheerio) ===");
  console.log("Start time:", new Date().toISOString());

  const theaters: Record<string, ScrapeResult<ScrapedBonus>> = {};
  const allBonuses: ScrapedBonus[] = [];
  const allErrors: string[] = [];

  for (const config of THEATER_CONFIGS) {
    const result = await scrapeTheater(config);
    theaters[config.id] = result;
    allBonuses.push(...result.data);
    allErrors.push(...result.errors);

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("[Light Scrape] Starting Facebook scrape...");
  const facebookPosts = await scrapeAllFacebookPages();
  const facebookBonuses = await parseFacebookBonuses(facebookPosts);
  allBonuses.push(...facebookBonuses);

  console.log("=== Light Scrape Complete ===");
  console.log(`Theater bonuses: ${allBonuses.length - facebookBonuses.length}`);
  console.log(`Facebook posts: ${facebookPosts.length}`);
  console.log(`Facebook bonuses: ${facebookBonuses.length}`);
  console.log(`Total bonuses: ${allBonuses.length}`);

  return {
    theaters,
    facebookPosts,
    facebookBonuses,
    allBonuses,
    totalBonuses: allBonuses.length,
    errors: allErrors,
    scrapedAt: new Date().toISOString(),
  };
}
