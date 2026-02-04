/**
 * 近期上映追蹤模組
 *
 * 爬開眼電影網取得現正上映 + 即將上映列表，
 * 自動偵測新電影和重映電影，與現有資料比對。
 */

import * as cheerio from "cheerio";
import { fetchPage } from "./fetcher";
import { detectRerelease } from "./rerelease";

// ============================================================
// 型別
// ============================================================

export interface NowShowingMovie {
  title: string;
  url: string;
  releaseDate: string;
  isRerelease: boolean;
  source: "atmovies-now" | "atmovies-next";
}

export interface NowShowingResult {
  nowShowing: NowShowingMovie[];
  upcoming: NowShowingMovie[];
  errors: string[];
  scrapedAt: string;
}

// ============================================================
// 開眼電影網爬蟲
// ============================================================

const ATMOVIES_NOW_URL = "https://www.atmovies.com.tw/movie/now/";
const ATMOVIES_NEXT_URL = "https://www.atmovies.com.tw/movie/next/";

/**
 * 解析開眼電影網的電影列表頁面
 */
function parseAtmoviesPage(
  html: string,
  source: "atmovies-now" | "atmovies-next"
): NowShowingMovie[] {
  const $ = cheerio.load(html);
  const movies: NowShowingMovie[] = [];

  const selectors = [
    "ul.filmList li",
    ".filmListAll li",
    ".at0 li",
    ".runtime a",
    "table a[href*='/movie/']",
    "a[href*='/movie/f']",
  ];

  const seen = new Set<string>();

  for (const selector of selectors) {
    $(selector).each((_i, el) => {
      let title = "";
      let href = "";
      let dateText = "";

      if ($(el).is("li")) {
        const titleEl = $(el).find("a").first();
        title = titleEl.text().trim();
        href = titleEl.attr("href") || "";
        dateText = $(el).find(".runtime, .date, span").text().trim();
      } else if ($(el).is("a")) {
        title = $(el).text().trim();
        href = $(el).attr("href") || "";
        dateText = $(el).parent().find(".runtime, .date, span").text().trim();
      }

      if (!title || title.length < 2 || seen.has(title)) return;
      seen.add(title);

      const dateMatch = dateText.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      const releaseDate = dateMatch
        ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
        : "";

      const fullUrl = href.startsWith("http")
        ? href
        : href
        ? `https://www.atmovies.com.tw${href}`
        : "";

      movies.push({
        title,
        url: fullUrl,
        releaseDate,
        isRerelease: detectRerelease(title),
        source,
      });
    });
  }

  return movies;
}

/**
 * 爬取開眼電影網現正上映列表
 */
export async function scrapeNowShowing(): Promise<NowShowingMovie[]> {
  console.log("[NowShowing] Fetching atmovies now showing...");
  const result = await fetchPage(ATMOVIES_NOW_URL, { timeout: 15000 });
  if (!result.success) {
    console.error(`[NowShowing] Failed to fetch: ${result.error}`);
    return [];
  }

  const movies = parseAtmoviesPage(result.html, "atmovies-now");
  console.log(`[NowShowing] Found ${movies.length} now-showing movies`);
  return movies;
}

/**
 * 爬取開眼電影網即將上映列表
 */
export async function scrapeUpcoming(): Promise<NowShowingMovie[]> {
  console.log("[NowShowing] Fetching atmovies upcoming...");
  const result = await fetchPage(ATMOVIES_NEXT_URL, { timeout: 15000 });
  if (!result.success) {
    console.error(`[NowShowing] Failed to fetch: ${result.error}`);
    return [];
  }

  const movies = parseAtmoviesPage(result.html, "atmovies-next");
  console.log(`[NowShowing] Found ${movies.length} upcoming movies`);
  return movies;
}

/**
 * 比對開眼列表與現有電影標題，找出缺少的電影
 */
export function findMissingMovies(
  atmoviesMovies: NowShowingMovie[],
  existingTitles: string[]
): NowShowingMovie[] {
  const normalizedExisting = new Set(
    existingTitles.map((t) => normalizeTitle(t))
  );

  return atmoviesMovies.filter((movie) => {
    const normalized = normalizeTitle(movie.title);
    if (normalizedExisting.has(normalized)) return false;
    for (const existing of normalizedExisting) {
      if (existing.includes(normalized) || normalized.includes(existing)) {
        return false;
      }
    }
    return true;
  });
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ffa-z0-9]/g, "")
    .trim();
}

/**
 * 執行完整的近期上映追蹤
 */
export async function runNowShowingTracker(): Promise<NowShowingResult> {
  const errors: string[] = [];

  let nowShowing: NowShowingMovie[] = [];
  let upcoming: NowShowingMovie[] = [];

  try {
    nowShowing = await scrapeNowShowing();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Now showing scrape failed: ${msg}`);
  }

  await new Promise((r) => setTimeout(r, 1000));

  try {
    upcoming = await scrapeUpcoming();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Upcoming scrape failed: ${msg}`);
  }

  console.log(
    `[NowShowing] Complete: ${nowShowing.length} now showing, ${upcoming.length} upcoming, ${errors.length} errors`
  );

  return {
    nowShowing,
    upcoming,
    errors,
    scrapedAt: new Date().toISOString(),
  };
}
