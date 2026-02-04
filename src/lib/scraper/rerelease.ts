/**
 * 重映/再上映偵測模組
 *
 * 偵測電影是否為重映版本，並為搜尋查詢加上適當的關鍵字
 * 以避免抓到原版上映的舊資訊。
 */

// ============================================================
// 重映關鍵字
// ============================================================

/** 標題或內容中出現這些關鍵字，代表可能是重映 */
export const RERELEASE_KEYWORDS = [
  "重映",
  "再上映",
  "4K",
  "IMAX",
  "數位修復",
  "經典回歸",
  "重返大銀幕",
  "紀念版",
  "紀念上映",
  "周年紀念",
  "重新上映",
  "復刻上映",
  "經典重映",
  "數位紀念版",
  "Dolby Cinema",
  "杜比影院",
  "4K修復",
  "4K 修復",
  "數位修復版",
  "重製版",
  "特別版上映",
] as const;

/** 用於搜尋時附加的重映修飾詞 */
const RERELEASE_SEARCH_MODIFIERS = ["重映", "重新上映", "特典"];

// ============================================================
// 偵測函式
// ============================================================

/**
 * 檢查文字中是否包含重映相關關鍵字
 */
export function containsRereleaseKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return RERELEASE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * 偵測電影是否為重映版本
 * @param title 電影標題
 * @param additionalText 額外文字（synopsis, 搜尋結果等）
 * @returns true if likely a rerelease
 */
export function detectRerelease(title: string, additionalText?: string): boolean {
  if (containsRereleaseKeywords(title)) return true;
  if (additionalText && containsRereleaseKeywords(additionalText)) return true;
  return false;
}

/**
 * 為重映電影建立搜尋查詢
 * 加上年份和「重映」關鍵字，避免抓到原版舊資料
 *
 * @example
 * buildRereleaseSearchQuery("魔法公主", 2026) → "魔法公主 2026 重映 重新上映 特典"
 */
export function buildRereleaseSearchQuery(
  movieTitle: string,
  year?: number
): string {
  const currentYear = year ?? new Date().getFullYear();
  const parts = [movieTitle, String(currentYear), ...RERELEASE_SEARCH_MODIFIERS];
  return parts.join(" ");
}

/**
 * 為一般電影建立搜尋查詢（非重映）
 */
export function buildSearchQuery(
  movieTitle: string,
  suffix: string = "特典 入場禮"
): string {
  return `${movieTitle} ${suffix}`;
}

/**
 * 從搜尋結果文字中提取日期，判斷是否過時
 * @param text 搜尋結果摘要文字
 * @param maxAgeMonths 最大允許月份數（預設 3）
 * @returns { isRecent, extractedDate }
 */
export function checkDateRelevance(
  text: string,
  maxAgeMonths: number = 3
): { isRecent: boolean; extractedDate: string | null } {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - maxAgeMonths);

  // 嘗試匹配各種日期格式
  const datePatterns = [
    // 2025-01-15, 2025/01/15
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g,
    // 2025年1月15日
    /(\d{4})年(\d{1,2})月(\d{1,2})日/g,
    // Jan 15, 2025 / January 15, 2025
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})/gi,
  ];

  let latestDate: Date | null = null;
  let latestDateStr: string | null = null;

  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let parsed: Date | null = null;

      if (match.length === 4 && match[1].length === 4) {
        // YYYY-MM-DD or YYYY年M月D日
        parsed = new Date(
          parseInt(match[1]),
          parseInt(match[2]) - 1,
          parseInt(match[3])
        );
      }

      if (parsed && !isNaN(parsed.getTime())) {
        if (!latestDate || parsed > latestDate) {
          latestDate = parsed;
          latestDateStr = match[0];
        }
      }
    }
  }

  if (!latestDate) {
    // 找不到日期，不確定是否最新，保守地回傳 true
    return { isRecent: true, extractedDate: null };
  }

  return {
    isRecent: latestDate >= cutoff,
    extractedDate: latestDateStr,
  };
}

/**
 * 計算搜尋時間限制（最近 N 個月）的 freshness 參數
 * 用於 Brave Search API 等支援時間過濾的搜尋引擎
 */
export function getFreshnessParam(months: number = 3): string {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - months);

  const formatDate = (d: Date) =>
    d.toISOString().split("T")[0]; // YYYY-MM-DD

  return `${formatDate(from)}to${formatDate(now)}`;
}
