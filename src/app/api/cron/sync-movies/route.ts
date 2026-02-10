/**
 * API Route: /api/cron/sync-movies
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  console.log("[CRON sync-movies] Starting scheduled sync...");
  const requestStartTime = Date.now();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Fail-closed: missing env must reject
    if (!cronSecret) {
      console.error("[CRON sync-movies] CRON_SECRET is not configured");
      return NextResponse.json(
        {
          error: "Server misconfiguration",
          message: "CRON_SECRET is required",
        },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[CRON sync-movies] Unauthorized access attempt");
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing CRON_SECRET",
        },
        { status: 401 }
      );
    }

    const scrapeUrl = new URL("/api/scrape", request.url);
    scrapeUrl.searchParams.set("secret", cronSecret);

    const scrapeResponse = await fetch(scrapeUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "User-Agent": "MovieBonus-Cron/1.0",
      },
    });

    if (!scrapeResponse.ok) {
      throw new Error(
        `Scrape API failed: ${scrapeResponse.status} ${scrapeResponse.statusText}`
      );
    }

    const scrapeResult = await scrapeResponse.json();
    const executionTime = Date.now() - requestStartTime;

    const syncSummary = {
      success: scrapeResult.success,
      executionTimeMs: executionTime,
      tmdbMovies: scrapeResult.tmdbMovieCount || 0,
      totalBonuses: scrapeResult.totalBonuses || 0,
      mergedMovies: scrapeResult.movies?.length || 0,
      supabaseSynced: scrapeResult.supabaseSync?.savedCount || 0,
      errors: [
        ...(scrapeResult.theaterErrors || []),
        ...(scrapeResult.supabaseSync?.errors || []),
      ],
      timestamp: new Date().toISOString(),
    };

    if (syncSummary.success && syncSummary.supabaseSynced > 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${syncSummary.supabaseSynced} movies from TMDB`,
        data: syncSummary,
        nextSync: getNextSyncTime(),
      });
    }

    if (syncSummary.success) {
      return NextResponse.json({
        success: true,
        message: "Scrape completed but no new movies synced",
        data: syncSummary,
        nextSync: getNextSyncTime(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Sync completed with errors",
        data: syncSummary,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("[CRON sync-movies] Fatal error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const executionTime = Date.now() - requestStartTime;

    return NextResponse.json(
      {
        success: false,
        message: `Sync failed: ${errorMessage}`,
        data: {
          success: false,
          executionTimeMs: executionTime,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

function getNextSyncTime(): string {
  const nextSync = new Date();
  nextSync.setHours(nextSync.getHours() + 6);
  return nextSync.toISOString();
}

export async function POST(request: Request): Promise<Response> {
  console.log("[CRON sync-movies] Manual sync triggered via POST");

  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        {
          error: "Server misconfiguration",
          message: "CRON_SECRET is required",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const manualSecret = searchParams.get("secret");

    if (!manualSecret || manualSecret !== cronSecret) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Manual trigger requires valid secret parameter",
        },
        { status: 401 }
      );
    }

    const fakeRequest = new Request(request.url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${cronSecret}`,
      },
    });

    return await GET(fakeRequest);
  } catch (error) {
    console.error("[CRON sync-movies] Manual trigger error:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Manual sync failed: ${error}`,
      },
      { status: 500 }
    );
  }
}
