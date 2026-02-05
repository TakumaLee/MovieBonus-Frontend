/**
 * Supabase 同步工具
 * 將前端 MovieData 格式轉換為 Python Backend Movie 格式
 */

import type { MovieData } from "@/data/movies";

// Python Backend Movie Model 介面
interface BackendMovie {
  id: string;
  title: string;
  english_title?: string;
  status: "showing" | "coming_soon" | "ended";
  vieshow_movie_id?: string;
  genre: string[];
  rating?: string;
  duration?: number;
  director: string[];
  cast: string[];
  synopsis?: string;
  release_date?: string;
  end_date?: string;
  poster_url?: string;
  trailer_url?: string;
  gallery: string[];
  // TMDB 新增欄位
  tmdb_id?: number;
  vote_average?: number;
  backdrop_url?: string;
  data_source: "manual" | "tmdb" | "scraper" | "user-report";
  // Scraping metadata - 簡化版本
  scraping_metadata: {
    last_updated: string;
    source_url: string;
    page_number: number;
    cinema_chain: string;
    status_last_checked: string;
  };
}

/**
 * 將前端 MovieData 轉換為 Python Backend Movie 格式
 */
export function convertMovieDataToBackendFormat(movie: MovieData): BackendMovie {
  return {
    id: movie.id,
    title: movie.title,
    english_title: movie.titleEn,
    status: mapMovieStatus(movie),
    vieshow_movie_id: extractVieShowId(movie),
    genre: movie.genre || [],
    rating: movie.rating,
    duration: movie.duration,
    director: extractDirectors(movie),
    cast: extractCast(movie),
    synopsis: movie.synopsis,
    release_date: movie.releaseDate,
    end_date: null, // Frontend 目前沒有這個欄位
    poster_url: movie.posterUrl,
    trailer_url: null, // Frontend 目前沒有這個欄位
    gallery: [], // Frontend 目前沒有這個欄位
    // TMDB 欄位
    tmdb_id: movie.tmdbId,
    vote_average: movie.voteAverage,
    backdrop_url: movie.backdropUrl,
    data_source: movie.dataSource || "tmdb",
    // Scraping metadata
    scraping_metadata: {
      last_updated: new Date().toISOString(),
      source_url: "https://api.themoviedb.org",
      page_number: 1,
      cinema_chain: "tmdb",
      status_last_checked: new Date().toISOString()
    }
  };
}

/**
 * 對應電影狀態
 */
function mapMovieStatus(movie: MovieData): "showing" | "coming_soon" | "ended" {
  const now = new Date();
  const releaseDate = movie.releaseDate ? new Date(movie.releaseDate) : null;
  
  if (!releaseDate) {
    return "showing"; // 預設為現正上映
  }
  
  if (releaseDate > now) {
    return "coming_soon"; // 即將上映
  }
  
  // 檢查是否已下檔（簡單邏輯：上映超過 8 週視為下檔）
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  if (releaseDate < eightWeeksAgo) {
    return "ended"; // 已下檔
  }
  
  return "showing"; // 現正上映
}

/**
 * 提取威秀電影 ID
 */
function extractVieShowId(movie: MovieData): string | undefined {
  // 從 theaterBonuses 中找威秀的 ticketUrl 或其他來源
  const vieShowBonus = movie.theaterBonuses?.find(bonus => 
    bonus.theaterId === "vieshow" || bonus.theaterName.includes("威秀")
  );
  
  if (vieShowBonus?.ticketUrl) {
    // 嘗試從 URL 提取 ID（例如：?movie=12345）
    const match = vieShowBonus.ticketUrl.match(/movie[=\/](\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // 如果沒找到，就用 TMDB ID 作為替代
  return movie.tmdbId?.toString();
}

/**
 * 提取導演清單
 */
function extractDirectors(movie: MovieData): string[] {
  // Frontend MovieData 目前沒有 director 欄位
  // 可以從 synopsis 或其他地方嘗試提取，或回傳空陣列
  return [];
}

/**
 * 提取演員清單
 */
function extractCast(movie: MovieData): string[] {
  // Frontend MovieData 目前沒有 cast 欄位
  // 可以從 synopsis 或其他地方嘗試提取，或回傳空陣列
  return [];
}

/**
 * 批量轉換電影資料
 */
export function convertMoviesBatch(movies: MovieData[]): BackendMovie[] {
  return movies.map(convertMovieDataToBackendFormat);
}

/**
 * 呼叫 Python Backend API 儲存電影
 */
export async function saveMoviesToSupabase(movies: MovieData[]): Promise<{
  success: boolean;
  message: string;
  savedCount: number;
  errors: string[];
}> {
  try {
    console.log(`[Supabase Sync] Converting ${movies.length} movies to backend format...`);
    
    const backendMovies = convertMoviesBatch(movies);
    
    console.log(`[Supabase Sync] Calling Python Backend API...`);
    
    // 呼叫 Python Backend
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/save-movies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.PYTHON_BACKEND_TOKEN 
          ? `Bearer ${process.env.PYTHON_BACKEND_TOKEN}`
          : ""
      },
      body: JSON.stringify(backendMovies)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log(`[Supabase Sync] Backend response:`, result);
    
    return {
      success: result.success || false,
      message: result.message || "Unknown response",
      savedCount: result.successful_saves || 0,
      errors: result.errors || []
    };
    
  } catch (error) {
    console.error(`[Supabase Sync] Error:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      savedCount: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * 直接用 Supabase JS Client 寫入（備用方案）
 */
export async function saveMoviesDirectToSupabase(movies: MovieData[]): Promise<{
  success: boolean;
  message: string;
  savedCount: number;
  errors: string[];
}> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log(`[Direct Supabase] Saving ${movies.length} movies...`);
    
    let savedCount = 0;
    const errors: string[] = [];
    
    for (const movie of movies) {
      try {
        const movieData = {
          title: movie.title,
          english_title: movie.titleEn,
          synopsis: movie.synopsis,
          genre: movie.genre,
          duration: movie.duration,
          rating: movie.rating,
          release_date: movie.releaseDate,
          poster_url: movie.posterUrl,
          tmdb_id: movie.tmdbId,
          vote_average: movie.voteAverage,
          backdrop_url: movie.backdropUrl,
          data_source: movie.dataSource || "tmdb",
          status: mapMovieStatus(movie)
        };
        
        // 使用 upsert 避免重複
        const { error } = await supabase
          .from('movies')
          .upsert(movieData, { 
            onConflict: 'tmdb_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          errors.push(`${movie.title}: ${error.message}`);
        } else {
          savedCount++;
        }
        
      } catch (movieError) {
        errors.push(`${movie.title}: ${movieError}`);
      }
    }
    
    return {
      success: savedCount > 0,
      message: `Saved ${savedCount}/${movies.length} movies directly to Supabase`,
      savedCount,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Direct Supabase save failed: ${error}`,
      savedCount: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}