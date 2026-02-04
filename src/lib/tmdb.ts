/**
 * TMDB API 整合層
 *
 * 提供台灣現正上映片單、電影詳情、上映日期（重映偵測）等功能。
 * 與 Supabase 資料互補：TMDB 提供即時片單，Supabase 提供特典資料。
 *
 * 所有 API call 使用 Next.js fetch cache（revalidate: 3600）。
 * 環境變數：TMDB_API_KEY
 */

import type { MovieData } from "@/data/movies";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("[TMDB] TMDB_API_KEY is not set");
  return key;
}

// ============================================================
// TMDB 型別
// ============================================================

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  genres: { id: number; name: string }[];
  popularity: number;
  adult: boolean;
  original_language: string;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
}

interface TMDBNowPlayingResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
  dates: { maximum: string; minimum: string };
}

interface TMDBReleaseDateEntry {
  certification: string;
  descriptors: string[];
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number; // 1=Premiere, 2=TheatricalLimited, 3=Theatrical, 4=Digital, 5=Physical, 6=TV
}

interface TMDBReleaseDatesResponse {
  id: number;
  results: {
    iso_3166_1: string;
    release_dates: TMDBReleaseDateEntry[];
  }[];
}

// Genre ID → 中文名稱 mapping
const GENRE_MAP: Record<number, string> = {
  28: "動作",
  12: "冒險",
  16: "動畫",
  35: "喜劇",
  80: "犯罪",
  99: "紀錄",
  18: "劇情",
  10751: "家庭",
  14: "奇幻",
  36: "歷史",
  27: "恐怖",
  10402: "音樂",
  9648: "懸疑",
  10749: "愛情",
  878: "科幻",
  10770: "電視電影",
  53: "驚悚",
  10752: "戰爭",
  37: "西部",
};

// ============================================================
// API 呼叫
// ============================================================

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  console.log(`[TMDB] Fetching: ${path}`);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`[TMDB] HTTP ${res.status} for ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * 取得台灣現正上映片單（自動分頁取全部）
 */
export async function fetchNowPlaying(
  maxPages: number = 5
): Promise<TMDBMovie[]> {
  const allMovies: TMDBMovie[] = [];

  const firstPage = await tmdbFetch<TMDBNowPlayingResponse>(
    "/movie/now_playing",
    {
      region: "TW",
      language: "zh-TW",
      page: "1",
    }
  );

  allMovies.push(...firstPage.results);
  const totalPages = Math.min(firstPage.total_pages, maxPages);

  console.log(
    `[TMDB] Now playing: page 1/${totalPages}, got ${firstPage.results.length} movies`
  );

  for (let page = 2; page <= totalPages; page++) {
    const pageData = await tmdbFetch<TMDBNowPlayingResponse>(
      "/movie/now_playing",
      {
        region: "TW",
        language: "zh-TW",
        page: String(page),
      }
    );
    allMovies.push(...pageData.results);
  }

  console.log(`[TMDB] Total now playing: ${allMovies.length} movies`);
  return allMovies;
}

/**
 * 取得單部電影詳情
 */
export async function fetchMovieDetails(
  tmdbId: number
): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`, {
    language: "zh-TW",
  });
}

/**
 * 取得電影的台灣上映日期（可偵測重映）
 */
export async function fetchReleaseDates(tmdbId: number): Promise<{
  dates: TMDBReleaseDateEntry[];
  isRerelease: boolean;
  latestTheatricalDate: string | null;
}> {
  const data = await tmdbFetch<TMDBReleaseDatesResponse>(
    `/movie/${tmdbId}/release_dates`
  );

  const twEntry = data.results.find((r) => r.iso_3166_1 === "TW");
  const dates = twEntry?.release_dates ?? [];

  // 偵測重映：如果有多個 type=3 (Theatrical) 的日期，代表重映
  const theatricalDates = dates.filter((d) => d.type === 3);
  const isRerelease = theatricalDates.length > 1;
  const latestTheatricalDate =
    theatricalDates.length > 0
      ? theatricalDates.sort((a, b) =>
          b.release_date.localeCompare(a.release_date)
        )[0].release_date
      : null;

  return { dates, isRerelease, latestTheatricalDate };
}

// ============================================================
// 資料轉換：TMDB → MovieData interface
// ============================================================

/**
 * 取得 TMDB 圖片完整 URL
 */
export function getTMDBImageUrl(
  path: string | null,
  size: string = "w500"
): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * 將 TMDB genre_ids 轉成中文名稱陣列
 */
function genreIdsToNames(ids: number[]): string[] {
  return ids.map((id) => GENRE_MAP[id] || `類型${id}`).filter(Boolean);
}

/**
 * 將 TMDB 電影資料轉成 MovieData interface（正式版 data/movies.ts 的型別）
 */
export function tmdbMovieToMovieData(
  tmdb: TMDBMovie,
  detail?: TMDBMovieDetail
): MovieData {
  const genres = detail
    ? detail.genres.map((g) => g.name)
    : genreIdsToNames(tmdb.genre_ids);

  return {
    id: `tmdb-${tmdb.id}`,
    title: tmdb.title,
    titleEn:
      tmdb.original_language !== "zh" ? tmdb.original_title : undefined,
    releaseDate: tmdb.release_date,
    posterUrl: getTMDBImageUrl(tmdb.poster_path),
    synopsis: detail?.overview || tmdb.overview || "暫無劇情簡介",
    genre: genres,
    duration: detail?.runtime ?? 0,
    rating: "",
    theaterBonuses: [],
    dataSource: "scraper",
    tmdbId: tmdb.id,
    voteAverage: tmdb.vote_average,
    backdropUrl: getTMDBImageUrl(tmdb.backdrop_path, "w1280"),
  };
}

/**
 * 批次取得電影詳情並轉換
 */
export async function fetchAndConvertMovies(
  tmdbMovies: TMDBMovie[]
): Promise<MovieData[]> {
  const movies: MovieData[] = [];

  for (const tmdb of tmdbMovies) {
    try {
      const detail = await fetchMovieDetails(tmdb.id);
      const movie = tmdbMovieToMovieData(tmdb, detail);

      // 嘗試取得台灣分級
      try {
        const releaseInfo = await fetchReleaseDates(tmdb.id);
        if (releaseInfo.dates.length > 0) {
          const cert = releaseInfo.dates.find(
            (d) => d.certification
          )?.certification;
          if (cert) movie.rating = cert;
          if (releaseInfo.isRerelease) {
            movie.isRerelease = true;
          }
          if (releaseInfo.latestTheatricalDate) {
            const twDate = releaseInfo.latestTheatricalDate.split("T")[0];
            if (twDate) movie.releaseDate = twDate;
          }
        }
      } catch (e) {
        console.log(
          `[TMDB] Could not fetch release dates for ${tmdb.id}: ${e}`
        );
      }

      movies.push(movie);
    } catch (e) {
      console.error(
        `[TMDB] Failed to fetch details for ${tmdb.id} (${tmdb.title}): ${e}`
      );
      movies.push(tmdbMovieToMovieData(tmdb));
    }
  }

  console.log(`[TMDB] Converted ${movies.length} movies`);
  return movies;
}
