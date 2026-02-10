#!/usr/bin/env node
/**
 * 海報批次更新腳本：把 Supabase 裡的低解析度海報換成 TMDB 高清版
 *
 * 使用方法：
 *   node scripts/update-posters-tmdb.js [options]
 *
 * 選項：
 *   --dry-run     只檢查不更新（預設）
 *   --execute     實際執行更新
 *   --limit N     只處理前 N 筆
 *   --skip-tmdb   跳過已經是 TMDB 圖片的記錄
 *
 * 範例：
 *   node scripts/update-posters-tmdb.js --dry-run
 *   node scripts/update-posters-tmdb.js --execute --limit 10
 */

const path = require('path');
const fs = require('fs');

// 載入 .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ 找不到 .env.local 檔案');
    process.exit(1);
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      process.env[key] = value;
    }
  }
}

loadEnv();

// ============================================================
// 設定
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase 設定缺失，請檢查 .env.local');
  process.exit(1);
}

if (!TMDB_API_KEY) {
  console.error('❌ TMDB_API_KEY 缺失，請檢查 .env.local');
  process.exit(1);
}

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================================
// API 函式
// ============================================================

/**
 * Supabase REST API 呼叫
 */
async function supabaseQuery(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (options.method === 'PATCH' || options.method === 'DELETE') {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  
  return response.json();
}

/**
 * TMDB 搜尋 API
 */
async function searchTMDB(title) {
  const url = new URL(`${TMDB_BASE}/search/movie`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('query', title);
  url.searchParams.set('language', 'zh-TW');
  url.searchParams.set('region', 'TW');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB search error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * 延遲函式（避免 rate limit）
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 計算字串相似度（Levenshtein distance based）
 */
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * 找最佳匹配的 TMDB 電影
 */
function findBestMatch(title, results, releaseYear = null) {
  if (!results || results.length === 0) return null;

  // 清理標題（去除特殊符號）
  const cleanTitle = (t) => t.replace(/[：:·・]/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedTitle = cleanTitle(title);

  let bestMatch = null;
  let bestScore = 0;

  for (const movie of results) {
    // 比較中文標題
    const tmdbTitle = cleanTitle(movie.title);
    let score = similarity(normalizedTitle, tmdbTitle);

    // 也比較原始標題
    if (movie.original_title) {
      const origScore = similarity(normalizedTitle, cleanTitle(movie.original_title));
      score = Math.max(score, origScore);
    }

    // 如果有年份資訊，加權
    if (releaseYear && movie.release_date) {
      const tmdbYear = parseInt(movie.release_date.substring(0, 4));
      if (Math.abs(tmdbYear - releaseYear) <= 1) {
        score += 0.1; // 年份接近加分
      }
    }

    // 有海報才考慮
    if (!movie.poster_path) {
      score -= 0.3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = movie;
    }
  }

  // 相似度門檻
  if (bestScore < 0.6) {
    return null;
  }

  return { movie: bestMatch, score: bestScore };
}

// ============================================================
// 主程式
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const skipTmdb = args.includes('--skip-tmdb');
  
  let limit = null;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1]);
  }

  console.log('🎬 MovieBonus 海報更新腳本');
  console.log('============================');
  console.log(`模式: ${dryRun ? '🔍 Dry Run（不會實際更新）' : '⚡ Execute（會更新資料庫）'}`);
  if (limit) console.log(`限制: 處理前 ${limit} 筆`);
  if (skipTmdb) console.log('跳過已是 TMDB 圖片的記錄');
  console.log('');

  // 1. 讀取所有電影
  console.log('📚 讀取 Supabase movies 表...');
  let movies = await supabaseQuery('/movies?select=id,title,poster_url,release_date');
  console.log(`   找到 ${movies.length} 部電影`);

  // 過濾已經是 TMDB 的
  if (skipTmdb) {
    movies = movies.filter(m => !m.poster_url?.includes('image.tmdb.org'));
    console.log(`   過濾後剩 ${movies.length} 部需要處理`);
  }

  // 限制數量
  if (limit) {
    movies = movies.slice(0, limit);
  }

  console.log('');

  // 2. 逐一處理
  const stats = {
    total: movies.length,
    found: 0,
    notFound: 0,
    alreadyTmdb: 0,
    updated: 0,
    errors: 0,
  };

  const updates = [];

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const progress = `[${i + 1}/${movies.length}]`;

    // 檢查是否已經是 TMDB 圖片
    if (movie.poster_url?.includes('image.tmdb.org')) {
      console.log(`${progress} ⏭️  ${movie.title} - 已是 TMDB 圖片`);
      stats.alreadyTmdb++;
      continue;
    }

    try {
      // 搜尋 TMDB
      const results = await searchTMDB(movie.title);
      
      // 取得年份
      let year = null;
      if (movie.release_date) {
        year = parseInt(movie.release_date.substring(0, 4));
      }

      const match = findBestMatch(movie.title, results, year);

      if (match && match.movie.poster_path) {
        const newPosterUrl = `${TMDB_IMAGE_BASE}${match.movie.poster_path}`;
        
        console.log(`${progress} ✅ ${movie.title}`);
        console.log(`         → TMDB: ${match.movie.title} (${match.movie.release_date?.substring(0, 4) || '?'})`);
        console.log(`         → 相似度: ${(match.score * 100).toFixed(1)}%`);
        console.log(`         → 新海報: ${newPosterUrl}`);

        updates.push({
          id: movie.id,
          title: movie.title,
          oldPoster: movie.poster_url,
          newPoster: newPosterUrl,
          tmdbId: match.movie.id,
          tmdbTitle: match.movie.title,
          score: match.score,
        });

        stats.found++;
      } else {
        console.log(`${progress} ❌ ${movie.title} - 找不到匹配`);
        stats.notFound++;
      }

      // Rate limit: TMDB 限制 ~40 req/10s
      await delay(300);

    } catch (error) {
      console.log(`${progress} ⚠️  ${movie.title} - 錯誤: ${error.message}`);
      stats.errors++;
    }
  }

  console.log('');
  console.log('============================');
  console.log('📊 統計');
  console.log(`   總數: ${stats.total}`);
  console.log(`   找到匹配: ${stats.found}`);
  console.log(`   找不到: ${stats.notFound}`);
  console.log(`   已是 TMDB: ${stats.alreadyTmdb}`);
  console.log(`   錯誤: ${stats.errors}`);
  console.log('');

  // 3. 執行更新
  if (updates.length > 0) {
    if (dryRun) {
      console.log(`🔍 Dry Run 完成 - ${updates.length} 部電影可以更新`);
      console.log('   加上 --execute 參數來實際執行更新');
    } else {
      console.log(`⚡ 開始更新 ${updates.length} 筆記錄...`);
      
      for (const update of updates) {
        try {
          await supabaseQuery(`/movies?id=eq.${update.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ poster_url: update.newPoster }),
          });
          stats.updated++;
          console.log(`   ✅ 更新: ${update.title}`);
        } catch (error) {
          console.log(`   ❌ 更新失敗: ${update.title} - ${error.message}`);
        }
        await delay(100);
      }

      console.log('');
      console.log(`✅ 完成！成功更新 ${stats.updated} 筆記錄`);
    }
  } else {
    console.log('✨ 沒有需要更新的記錄');
  }

  // 輸出詳細報告
  if (updates.length > 0) {
    const reportPath = path.join(__dirname, 'poster-update-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(updates, null, 2));
    console.log(`\n📝 詳細報告已存到: ${reportPath}`);
  }
}

main().catch(error => {
  console.error('❌ 腳本執行失敗:', error);
  process.exit(1);
});
