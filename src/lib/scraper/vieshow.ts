/**
 * 威秀影城爬蟲 POC
 *
 * 威秀官網 (vscinemas.com.tw) 有 Akamai WAF 保護，
 * 直接 fetch 會拿到 403。
 *
 * 策略：
 * 1. 先嘗試 fetch（可能被擋）
 * 2. 如果被擋，fallback 到 atmovies 抓電影基本資料
 * 3. 特典資訊需要用 headless browser 或人工輸入
 *
 * 未來可考慮：
 * - Playwright headless browser
 * - 威秀 app API reverse engineering
 * - 定期人工更新 + LLM 輔助
 */

import { fetchPage, type FetchResult } from "./fetcher";
import type { ScrapedMovie, ScrapeResult } from "./types";

const VIESHOW_BASE = "https://www.vscinemas.com.tw";
const ATMOVIES_NOW = "https://www.atmovies.com.tw/movie/now/";

/**
 * 嘗試從威秀官網抓取電影列表
 * ⚠️ 目前會被 WAF 擋，僅作為 POC
 */
export async function scrapeVieshowMovies(): Promise<
  ScrapeResult<ScrapedMovie>
> {
  const result: ScrapeResult<ScrapedMovie> = {
    success: false,
    data: [],
    errors: [],
    sourceUrl: VIESHOW_BASE,
    scrapedAt: new Date().toISOString(),
  };

  // Attempt 1: 直接抓威秀
  const vieshowResult = await fetchPage(
    `${VIESHOW_BASE}/vsweb/film/index.aspx`
  );

  if (vieshowResult.success) {
    result.success = true;
    result.data = parseVieshowHtml(vieshowResult);
    return result;
  }

  result.errors.push(
    `Vieshow fetch failed: ${vieshowResult.error || vieshowResult.statusCode}`
  );

  // Fallback: 用 atmovies 的現正上映列表
  const atmoviesResult = await fetchPage(ATMOVIES_NOW);

  if (atmoviesResult.success) {
    result.success = true;
    result.sourceUrl = ATMOVIES_NOW;
    result.data = parseAtmoviesHtml(atmoviesResult);
    result.errors.push(
      "Fell back to atmovies (no bonus info from this source)"
    );
    return result;
  }

  result.errors.push(
    `Atmovies fallback also failed: ${atmoviesResult.error || atmoviesResult.statusCode}`
  );
  return result;
}

/**
 * 解析威秀 HTML（placeholder — 需要實際 HTML 樣本來完善）
 */
function parseVieshowHtml(result: FetchResult): ScrapedMovie[] {
  // TODO: 實作解析邏輯
  // 目前回傳空陣列，因為 WAF 擋住了
  console.log(
    "[Vieshow Scraper] Got HTML, length:",
    result.html.length
  );
  return [];
}

/**
 * 解析開眼電影網 HTML — 提取電影基本資料
 * 這個比較可靠，因為 atmovies 沒有 WAF
 */
function parseAtmoviesHtml(result: FetchResult): ScrapedMovie[] {
  const movies: ScrapedMovie[] = [];
  const html = result.html;

  // 使用簡單的正規表達式解析
  // 開眼的格式: <a href="/movie/{id}/">{title}</a>
  const moviePattern =
    /<a[^>]*href="\/movie\/([^"]+)\/"[^>]*>([^<]+)<\/a>/g;
  let match;

  while ((match = moviePattern.exec(html)) !== null) {
    const [, id, title] = match;
    if (id && title && !title.includes("首頁") && !title.includes("戲院")) {
      movies.push({
        title: title.trim(),
        sourceUrl: `https://www.atmovies.com.tw/movie/${id}/`,
      });
    }
  }

  return movies;
}

/**
 * 主進入點：執行威秀爬蟲
 */
export async function runVieshowScraper() {
  console.log("[Vieshow Scraper] Starting...");
  const result = await scrapeVieshowMovies();

  console.log(`[Vieshow Scraper] Done.`);
  console.log(`  Success: ${result.success}`);
  console.log(`  Movies found: ${result.data.length}`);
  console.log(`  Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    result.errors.forEach((e) => console.log(`  ⚠️ ${e}`));
  }

  return result;
}
