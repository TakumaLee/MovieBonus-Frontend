/**
 * API Route: /api/cron/sync-movies
 *
 * 專門供 Vercel Cron 呼叫的 TMDB 電影同步端點
 *
 * 功能：
 * 1. 定期從 TMDB 同步台灣現正上映片單
 * 2. 自動爬取特典資訊並合併
 * 3. 寫入 Supabase 資料庫
 * 4. 監控並回報同步狀態
 *
 * Cron 設定：每 6 小時執行一次
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  console.log("[CRON sync-movies] Starting scheduled sync...");
  
  try {
    // 安全檢查：驗證 Cron Secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[CRON sync-movies] Unauthorized access attempt");
      return NextResponse.json({ 
        error: "Unauthorized",
        message: "Invalid or missing CRON_SECRET"
      }, { status: 401 });
    }

    const startTime = Date.now();
    
    // 呼叫主要的 scrape pipeline
    console.log("[CRON sync-movies] Calling /api/scrape...");
    
    const scrapeUrl = new URL("/api/scrape", request.url);
    scrapeUrl.searchParams.set("secret", cronSecret);
    
    const scrapeResponse = await fetch(scrapeUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "User-Agent": "MovieBonus-Cron/1.0"
      }
    });
    
    if (!scrapeResponse.ok) {
      throw new Error(`Scrape API failed: ${scrapeResponse.status} ${scrapeResponse.statusText}`);
    }
    
    const scrapeResult = await scrapeResponse.json();
    const executionTime = Date.now() - startTime;
    
    // 檢查同步結果
    const syncSummary = {
      success: scrapeResult.success,
      executionTimeMs: executionTime,
      tmdbMovies: scrapeResult.tmdbMovieCount || 0,
      totalBonuses: scrapeResult.totalBonuses || 0,
      mergedMovies: scrapeResult.movies?.length || 0,
      supabaseSynced: scrapeResult.supabaseSync?.savedCount || 0,
      errors: [
        ...(scrapeResult.theaterErrors || []),
        ...(scrapeResult.supabaseSync?.errors || [])
      ],
      timestamp: new Date().toISOString()
    };
    
    console.log("[CRON sync-movies] Sync summary:", syncSummary);
    
    // 成功回應
    if (syncSummary.success && syncSummary.supabaseSynced > 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${syncSummary.supabaseSynced} movies from TMDB`,
        data: syncSummary,
        nextSync: getNextSyncTime()
      });
    } 
    
    // 部分成功
    else if (syncSummary.success) {
      return NextResponse.json({
        success: true,
        message: `Scrape completed but no new movies synced`,
        data: syncSummary,
        nextSync: getNextSyncTime()
      });
    } 
    
    // 失敗
    else {
      console.error("[CRON sync-movies] Sync failed:", syncSummary);
      return NextResponse.json({
        success: false,
        message: "Sync completed with errors",
        data: syncSummary
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("[CRON sync-movies] Fatal error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const executionTime = Date.now() - Date.now(); // 會是 0，但結構一致
    
    return NextResponse.json({
      success: false,
      message: `Sync failed: ${errorMessage}`,
      data: {
        success: false,
        executionTimeMs: executionTime,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 計算下次同步時間（6 小時後）
 */
function getNextSyncTime(): string {
  const nextSync = new Date();
  nextSync.setHours(nextSync.getHours() + 6);
  return nextSync.toISOString();
}

/**
 * POST 方法：手動觸發同步
 */
export async function POST(request: Request): Promise<Response> {
  console.log("[CRON sync-movies] Manual sync triggered via POST");
  
  try {
    // 檢查手動觸發授權
    const { searchParams } = new URL(request.url);
    const manualSecret = searchParams.get("secret");
    
    if (!manualSecret || manualSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ 
        error: "Unauthorized",
        message: "Manual trigger requires valid secret parameter"
      }, { status: 401 });
    }
    
    // 創建假的 authorization header
    const fakeRequest = new Request(request.url, {
      method: "GET",
      headers: {
        "authorization": `Bearer ${process.env.CRON_SECRET}`
      }
    });
    
    // 重用 GET 邏輯
    return await GET(fakeRequest);
    
  } catch (error) {
    console.error("[CRON sync-movies] Manual trigger error:", error);
    
    return NextResponse.json({
      success: false,
      message: `Manual sync failed: ${error}`
    }, { status: 500 });
  }
}