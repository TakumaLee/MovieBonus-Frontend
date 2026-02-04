/**
 * 資料合併邏輯 — 將 TMDB 片單和爬蟲結果做 fuzzy match
 *
 * 電影名稱比對：中文名、英文名、日文名都可能不完全一致
 * 用簡單的字串相似度（去掉標點、空格後比對）
 */

import type { MovieData, TheaterBonus, Bonus } from "@/data/movies";
import type { ScrapedBonus } from "@/lib/scraper/types";

// ============================================================
// 字串正規化
// ============================================================

/**
 * 正規化電影名稱以利比對：
 * - 轉小寫
 * - 移除標點符號、空格、特殊字元
 * - 全形轉半形
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    // 全形英數 → 半形
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    // 移除所有非 CJK、非英數字元
    .replace(
      /[^\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uFF66-\uFF9Fa-z0-9]/g,
      ""
    )
    .trim();
}

/**
 * 計算兩字串的相似度（0~1）
 * 使用最長公共子序列 (LCS) 比率
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return 1;

  // 包含關係：一方包含另一方
  if (na.includes(nb) || nb.includes(na)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    return shorter / longer;
  }

  // LCS
  const lcsLen = lcs(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return lcsLen / maxLen;
}

function lcs(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }

  return prev[n];
}

// ============================================================
// 電影名稱比對
// ============================================================

const MATCH_THRESHOLD = 0.5;

/**
 * 嘗試將一個爬蟲取得的電影名稱匹配到電影列表
 * 回傳最佳匹配的 MovieData 或 null
 */
export function findBestMatch(
  scrapedTitle: string,
  movies: MovieData[]
): MovieData | null {
  let bestMatch: MovieData | null = null;
  let bestScore = 0;

  for (const movie of movies) {
    const candidates = [movie.title];
    if (movie.titleEn) candidates.push(movie.titleEn);
    if (movie.titleJa) candidates.push(movie.titleJa);

    for (const candidate of candidates) {
      const score = similarity(scrapedTitle, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = movie;
      }
    }
  }

  if (bestScore >= MATCH_THRESHOLD) {
    console.log(
      `[Matcher] "${scrapedTitle}" → "${bestMatch?.title}" (score: ${bestScore.toFixed(2)})`
    );
    return bestMatch;
  }

  console.log(
    `[Matcher] "${scrapedTitle}" → no match (best: ${bestScore.toFixed(2)})`
  );
  return null;
}

// ============================================================
// 合併爬蟲資料到電影列表
// ============================================================

const THEATER_NAME_TO_ID: Record<string, string> = {
  威秀影城: "vieshow",
  威秀: "vieshow",
  秀泰影城: "showtimes",
  秀泰: "showtimes",
  國賓影城: "ambassador",
  國賓: "ambassador",
  美麗華影城: "miramar",
  美麗華: "miramar",
  "in89 豪華數位影城": "in89",
  in89豪華數位影城: "in89",
  in89: "in89",
};

const THEATER_TICKET_URLS: Record<string, string> = {
  vieshow: "https://www.vscinemas.com.tw/",
  showtimes: "https://www.showtimes.com.tw/",
  ambassador: "https://www.ambassador.com.tw/",
  miramar: "https://www.miramarcinemas.tw/",
  in89: "https://www.in89.com.tw/",
};

function resolveTheaterId(name: string): string {
  if (THEATER_NAME_TO_ID[name]) return THEATER_NAME_TO_ID[name];
  const normalized = normalize(name);
  for (const [key, id] of Object.entries(THEATER_NAME_TO_ID)) {
    if (normalize(key) === normalized) return id;
  }
  return name;
}

/**
 * 將爬蟲取得的 ScrapedBonus 陣列合併到 MovieData 陣列中
 * 回傳合併後的新 MovieData 陣列（不修改原陣列）
 */
export function mergeScrapedBonuses(
  movies: MovieData[],
  scrapedBonuses: ScrapedBonus[]
): MovieData[] {
  // 深拷貝
  const merged = movies.map((m) => ({
    ...m,
    theaterBonuses: m.theaterBonuses.map((tb) => ({
      ...tb,
      bonuses: [...tb.bonuses],
    })),
  }));

  // 按電影名稱分組 scraped bonuses
  const bonusesByMovie = new Map<string, ScrapedBonus[]>();
  for (const bonus of scrapedBonuses) {
    const key = bonus.movieTitle;
    if (!bonusesByMovie.has(key)) bonusesByMovie.set(key, []);
    bonusesByMovie.get(key)!.push(bonus);
  }

  for (const [movieTitle, bonuses] of bonusesByMovie) {
    const movie = findBestMatch(movieTitle, merged);
    if (!movie) continue;

    // 按影城分組
    const bonusesByTheater = new Map<string, ScrapedBonus[]>();
    for (const b of bonuses) {
      const theaterId = resolveTheaterId(b.theaterName);
      if (!bonusesByTheater.has(theaterId))
        bonusesByTheater.set(theaterId, []);
      bonusesByTheater.get(theaterId)!.push(b);
    }

    for (const [theaterId, theaterBonuses] of bonusesByTheater) {
      let tb = movie.theaterBonuses.find((t) => t.theaterId === theaterId);
      if (!tb) {
        const theaterName = theaterBonuses[0].theaterName;
        tb = {
          theaterId,
          theaterName,
          bonuses: [],
          ticketUrl: THEATER_TICKET_URLS[theaterId] || "",
        } satisfies TheaterBonus;
        movie.theaterBonuses.push(tb);
      }

      for (const sb of theaterBonuses) {
        const exists = tb.bonuses.some(
          (existing) =>
            existing.week === sb.week &&
            normalize(existing.description) === normalize(sb.description)
        );
        if (!exists) {
          tb.bonuses.push({
            week: sb.week,
            description: sb.description,
            quantity: sb.quantity,
          } satisfies Bonus);
        }
      }
    }

    movie.isVerified = true;
    movie.dataSource = "scraper";
  }

  return merged;
}
