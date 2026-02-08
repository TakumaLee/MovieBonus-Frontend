#!/usr/bin/env node
/**
 * MovieBonus - 同步 TMDB 正在上映電影
 * 
 * 功能：
 * 1. 從 TMDB 抓取台灣現正上映片單
 * 2. 比對 Supabase，新增還沒有的電影
 * 3. 自動填入高清海報
 * 
 * 用法：node scripts/sync-tmdb-now-playing.js
 */

const SUPABASE_URL = 'https://pcyggzipdpieiffithio.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWdnemlwZHBpZWlmZml0aGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3NTk5OSwiZXhwIjoyMDY3NzUxOTk5fQ.ZAHRt15VJ2siK23JwgFQeJZ1UXixfnSLiuG-Px5hNGs';
const TMDB_API_KEY = 'a129e5bf8a7538d526c052900e144f14';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  
  if (options.method === 'POST' || options.method === 'GET' || !options.method) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return { ok: true };
}

async function fetchTMDBNowPlaying() {
  const movies = [];
  
  // 抓前 3 頁（約 60 部）
  for (let page = 1; page <= 3; page++) {
    const url = `${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}&region=TW&language=zh-TW&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) break;
    
    const data = await res.json();
    movies.push(...data.results);
    
    if (page >= data.total_pages) break;
    await new Promise(r => setTimeout(r, 300));
  }
  
  return movies;
}

async function fetchMovieDetails(tmdbId) {
  const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-TW`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function main() {
  console.log('🎬 MovieBonus TMDB 同步腳本\n');
  
  // 1. 抓 TMDB 正在上映
  console.log('📡 抓取 TMDB 台灣現正上映...');
  const tmdbMovies = await fetchTMDBNowPlaying();
  console.log(`   找到 ${tmdbMovies.length} 部\n`);
  
  // 2. 讀取 Supabase 現有電影（用標題比對）
  console.log('📖 讀取 Supabase 電影列表...');
  const existingMovies = await supabaseFetch('/movies?select=id,title');
  const existingTitles = new Set(existingMovies.map(m => m.title.toLowerCase().trim()));
  console.log(`   現有 ${existingMovies.length} 部\n`);
  
  // 3. 找出新電影
  const newMovies = tmdbMovies.filter(m => 
    !existingTitles.has(m.title.toLowerCase().trim())
  );
  console.log(`🆕 新電影：${newMovies.length} 部\n`);
  
  if (newMovies.length === 0) {
    console.log('✅ 沒有新電影需要新增！');
    return;
  }
  
  // 4. 新增到 Supabase
  let added = 0;
  let failed = 0;
  
  for (const movie of newMovies) {
    try {
      // 抓詳細資訊
      const details = await fetchMovieDetails(movie.id);
      
      const newMovie = {
        id: generateUUID(),
        movie_id: `tmdb-${movie.id}`,
        title: movie.title,
        english_title: movie.original_language !== 'zh' ? movie.original_title : null,
        vieshow_movie_id: `tmdb-${movie.id}`,
        status: 'showing',
        genre: details?.genres?.map(g => g.name) || [],
        rating: '',
        duration: details?.runtime || 0,
        director: [],
        movie_cast: [],
        synopsis: movie.overview || '暫無劇情簡介',
        release_date: movie.release_date || null,
        poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
        trailer_url: null,
        gallery: [],
        data_source: 'tmdb',
      };
      
      await supabaseFetch('/movies', {
        method: 'POST',
        body: JSON.stringify(newMovie),
      });
      
      console.log(`✅ 新增：${movie.title}`);
      added++;
    } catch (err) {
      console.log(`❌ 失敗：${movie.title} - ${err.message}`);
      failed++;
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n📊 完成！新增 ${added} 部，失敗 ${failed} 部`);
}

main().catch(console.error);
