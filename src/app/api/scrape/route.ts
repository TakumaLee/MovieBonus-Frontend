/**
 * API Route: /api/scrape
 *
 * 前端爬蟲 pipeline，與後端 Python scrapers 互補。
 *
 * Pipeline:
 * 1. 從 TMDB 取台灣現正上映片單
 * 2. 爬各影城官網特典資訊（含 WAF fallback）
 * 3. Fuzzy match 合併資料
 * 4. 開眼電影網追蹤（偵測新片 + 重映）
 * 5. 回傳完整結果
 *
 * 可被 Vercel Cron 定時呼叫（vercel.json）
 * 或手動觸發：GET /api/scrape?secret=xxx
 */

import { NextResponse } from "next/server";
import { scrapeAllTheaters } from "@/lib/scraper/theater-scraper";
import { scrapeAllFacebookPages, parseFacebookBonuses } from "@/lib/scraper/light-scraper";
import { runNowShowingTracker } from "@/lib/scraper/now-showing";
import { detectRerelease } from "@/lib/scraper/rerelease";
import { mergeScrapedBonuses } from "@/lib/matcher";
import { saveMoviesToSupabase, saveMoviesDirectToSupabase } from "@/lib/supabase-sync";
import type { MovieData } from "@/data/movies";
import type { ScrapedBonus } from "@/lib/scraper/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  // 安全檢查
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && secretParam !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[API /scrape] Starting scrape pipeline...");

    // Step 1: TMDB 片單（如果有 TMDB_API_KEY）
    let tmdbMovies: MovieData[] = [];
    if (process.env.TMDB_API_KEY) {
      console.log("[API /scrape] Step 1: Fetching TMDB now playing...");
      try {
        // Dynamic import to avoid build issues when TMDB_API_KEY is not set
        const { fetchNowPlaying, fetchAndConvertMovies } = await import("@/lib/tmdb");
        const nowPlaying = await fetchNowPlaying();
        tmdbMovies = await fetchAndConvertMovies(nowPlaying);
        console.log(`[API /scrape] TMDB: ${tmdbMovies.length} movies`);
      } catch (e) {
        console.error("[API /scrape] TMDB fetch failed:", e);
      }
    } else {
      console.log("[API /scrape] Step 1: Skipping TMDB (no API key)");
    }

    // Step 2: 影城爬蟲
    console.log("[API /scrape] Step 2: Scraping theaters...");
    const theaterResult = await scrapeAllTheaters();
    console.log(`[API /scrape] Theater scraper: ${theaterResult.totalBonuses} bonuses`);

    // Step 3: Facebook 爬蟲
    console.log("[API /scrape] Step 3: Scraping Facebook pages...");
    let fbBonuses: ScrapedBonus[] = [];
    try {
      const fbPosts = await scrapeAllFacebookPages();
      fbBonuses = await parseFacebookBonuses(fbPosts);
      console.log(`[API /scrape] Facebook: ${fbBonuses.length} bonuses`);
    } catch (e) {
      console.error("[API /scrape] Facebook scrape failed:", e);
    }

    // Step 4: 近期上映追蹤（開眼電影網）
    console.log("[API /scrape] Step 4: Now-showing tracker...");
    let nowShowingData = null;
    try {
      nowShowingData = await runNowShowingTracker();
      console.log(
        `[API /scrape] Now showing: ${nowShowingData.nowShowing.length}, upcoming: ${nowShowingData.upcoming.length}`
      );
    } catch (e) {
      console.error("[API /scrape] Now-showing tracker failed:", e);
    }

    // Step 5: 合併 + 重映偵測
    const allScrapedBonuses = [...theaterResult.allBonuses, ...fbBonuses];
    let mergedMovies: MovieData[] =
      tmdbMovies.length > 0
        ? mergeScrapedBonuses(tmdbMovies, allScrapedBonuses)
        : [];

    // Auto-detect rereleases based on title keywords
    mergedMovies = mergedMovies.map((movie) => {
      if (!movie.isRerelease && detectRerelease(movie.title, movie.synopsis)) {
        return { ...movie, isRerelease: true };
      }
      return movie;
    });

    console.log(
      `[API /scrape] Merged: ${mergedMovies.length} movies with bonus data`
    );

    // Step 6: 寫入 Supabase（新增！）
    console.log("[API /scrape] Step 6: Saving to Supabase...");
    let supabaseSaveResult = null;
    
    if (mergedMovies.length > 0) {
      try {
        // 優先嘗試 Python Backend API
        supabaseSaveResult = await saveMoviesToSupabase(mergedMovies);
        
        if (!supabaseSaveResult.success) {
          console.log("[API /scrape] Python Backend failed, trying direct Supabase...");
          // Fallback: 直接寫入 Supabase
          supabaseSaveResult = await saveMoviesDirectToSupabase(mergedMovies);
        }
        
        console.log(`[API /scrape] Supabase result: ${supabaseSaveResult.savedCount}/${mergedMovies.length} saved`);
        
        if (supabaseSaveResult.errors.length > 0) {
          console.warn("[API /scrape] Supabase errors:", supabaseSaveResult.errors.slice(0, 3));
        }
      } catch (saveError) {
        console.error("[API /scrape] Supabase save failed:", saveError);
        supabaseSaveResult = {
          success: false,
          message: saveError instanceof Error ? saveError.message : String(saveError),
          savedCount: 0,
          errors: [saveError instanceof Error ? saveError.message : String(saveError)]
        };
      }
    } else {
      console.log("[API /scrape] No movies to save, skipping Supabase");
    }

    // Step 7: 回傳結果（包含 Supabase 同步狀態）
    const output = {
      success: true,
      lastScrapedAt: new Date().toISOString(),
      tmdbMovieCount: tmdbMovies.length,
      totalBonuses: allScrapedBonuses.length,
      movies: mergedMovies,
      bonuses: allScrapedBonuses,
      theaterErrors: theaterResult.errors,
      nowShowing: nowShowingData,
      // 新增：Supabase 同步結果
      supabaseSync: supabaseSaveResult,
    };

    console.log(
      `[API /scrape] Done. ${mergedMovies.length} movies, ${allScrapedBonuses.length} bonuses`
    );

    return NextResponse.json(output);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API /scrape] Fatal error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
