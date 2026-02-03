"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "moviebonus_favorites";

/**
 * 取得收藏清單
 */
export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 檢查是否已收藏
 */
export function isFavorited(movieId: string): boolean {
  return getFavorites().includes(movieId);
}

/**
 * 切換收藏狀態
 */
function toggleFavorite(movieId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(movieId);
  if (index === -1) {
    favorites.push(movieId);
  } else {
    favorites.splice(index, 1);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {}
  return index === -1; // return new state: true = now favorited
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

/**
 * Hook: 監聽收藏變化
 */
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

  useEffect(() => {
    setFavorited(isFavorited(movieId));
    setMounted(true);

    const handler = () => setFavorited(isFavorited(movieId));
    window.addEventListener(FAVORITE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(FAVORITE_CHANGE_EVENT, handler);
  }, [movieId]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const newState = toggleFavorite(movieId);
      setFavorited(newState);
      emitFavoriteChange();

      // Animate
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    },
    [movieId]
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