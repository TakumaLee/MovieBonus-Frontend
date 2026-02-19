"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ============================================================
// localStorage helpers（未登入 fallback）
// ============================================================

const STORAGE_KEY = "moviebonus_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalFavorites(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function isFavorited(movieId: string): boolean {
  return getFavorites().includes(movieId);
}

// ============================================================
// Supabase favorites helpers（已登入）
// ============================================================

async function fetchSupabaseFavorites(userId: string): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("movie_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[FavoriteButton] fetchSupabaseFavorites error:", error.message);
    return [];
  }
  return (data ?? []).map((row: { movie_id: string }) => row.movie_id);
}

async function addSupabaseFavorite(userId: string, movieId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, movie_id: movieId });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation（已存在，忽略）
    console.error("[FavoriteButton] addSupabaseFavorite error:", error.message);
  }
}

async function removeSupabaseFavorite(userId: string, movieId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("movie_id", movieId);

  if (error) {
    console.error("[FavoriteButton] removeSupabaseFavorite error:", error.message);
  }
}

/**
 * 將 localStorage 的收藏遷移到 Supabase（登入後一次性執行）
 */
async function migrateLocalFavoritesToSupabase(userId: string): Promise<void> {
  const localIds = getFavorites();
  if (localIds.length === 0) return;

  const supabase = getSupabaseBrowserClient();
  const rows = localIds.map((movie_id) => ({ user_id: userId, movie_id }));

  const { error } = await supabase.from("favorites").upsert(rows, {
    onConflict: "user_id,movie_id",
    ignoreDuplicates: true,
  });

  if (error) {
    console.error("[FavoriteButton] migrateLocalFavoritesToSupabase error:", error.message);
    return;
  }

  // 清除 localStorage（已遷移）
  setLocalFavorites([]);
  console.log(`[FavoriteButton] Migrated ${localIds.length} favorites to Supabase.`);
}

// ============================================================
// Custom event for cross-component sync
// ============================================================

const FAVORITE_CHANGE_EVENT = "moviebonus:favorites-changed";

function emitFavoriteChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FAVORITE_CHANGE_EVENT));
  }
}

// ============================================================
// Hook: 監聽收藏變化（localStorage 模式，供未登入頁面使用）
// ============================================================

export function useFavorites(): string[] {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());

    const handler = () => setFavorites(getFavorites());
    window.addEventListener(FAVORITE_CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(FAVORITE_CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return favorites;
}

// ============================================================
// FavoriteButton — 收藏按鈕（愛心）
// ============================================================

interface FavoriteButtonProps {
  movieId: string;
  /** 按鈕大小：sm 用於卡片, lg 用於詳情頁 */
  size?: "sm" | "lg";
  className?: string;
}

export default function FavoriteButton({
  movieId,
  size = "sm",
  className = "",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 追蹤上一個 userId，用來偵測「剛登入」事件
  const prevUserIdRef = useRef<string | null>(null);

  // ── 初始化：取得 Supabase session + 訂閱 auth 狀態變化 ──
  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    // 取得當前 session
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setUser(data.user ?? null);
    });

    // 監聽 auth 狀態變化（登入 / 登出）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── 依據 user 讀取收藏狀態 ──
  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (user) {
        const justLoggedIn = prevUserIdRef.current === null && user.id !== null;

        // 剛登入 → 先把 localStorage 遷移過去
        if (justLoggedIn) {
          await migrateLocalFavoritesToSupabase(user.id);
        }
        prevUserIdRef.current = user.id;

        // 從 Supabase 讀取收藏狀態
        const ids = await fetchSupabaseFavorites(user.id);
        if (isMounted) {
          setFavorited(ids.includes(movieId));
        }
      } else {
        // 未登入 → 讀 localStorage
        prevUserIdRef.current = null;
        if (isMounted) {
          setFavorited(isFavorited(movieId));
        }
      }

      if (isMounted) setMounted(true);
    }

    load();

    return () => { isMounted = false; };
  }, [user, movieId]);

  // ── 監聽 localStorage 收藏變化（未登入跨元件同步）──
  useEffect(() => {
    if (user) return; // 登入狀態不需監聽 localStorage event

    const handler = () => setFavorited(isFavorited(movieId));
    window.addEventListener(FAVORITE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(FAVORITE_CHANGE_EVENT, handler);
  }, [user, movieId]);

  // ── 點擊處理 ──
  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newState = !favorited;
      setFavorited(newState);

      // Animate
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);

      if (user) {
        // 已登入 → 操作 Supabase
        if (newState) {
          await addSupabaseFavorite(user.id, movieId);
        } else {
          await removeSupabaseFavorite(user.id, movieId);
        }
      } else {
        // 未登入 → 操作 localStorage
        const favorites = getFavorites();
        const index = favorites.indexOf(movieId);
        if (newState && index === -1) {
          favorites.push(movieId);
        } else if (!newState && index !== -1) {
          favorites.splice(index, 1);
        }
        setLocalFavorites(favorites);
        emitFavoriteChange();
      }
    },
    [favorited, user, movieId]
  );

  if (!mounted) return null;

  const isSmall = size === "sm";

  return (
    <button
      onClick={handleClick}
      aria-label={favorited ? "取消收藏" : "加入收藏"}
      title={favorited ? "取消收藏" : "加入收藏"}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200 
        ${isSmall ? "w-8 h-8 text-lg" : "w-10 h-10 text-2xl"}
        rounded-full
        ${
          favorited
            ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
            : "text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground"
        }
        ${animating ? "scale-125" : "scale-100"}
        ${className}
      `}
    >
      {favorited ? "❤️" : "🤍"}
    </button>
  );
}
