"use client";

/**
 * BonusVote — 使用者投票「特典還有/沒了」
 *
 * 從 MVP 整合而來，使用 localStorage 做本地投票。
 * 未來可擴充為 Supabase-backed 即時投票。
 */

import { useState, useEffect, useCallback } from "react";

interface BonusVoteProps {
  /** 電影 ID（Supabase UUID 或 slug） */
  movieId: string;
  /** 影城 ID（如 vieshow, ambassador） */
  theaterId: string;
  /** 週次（第幾週特典） */
  bonusWeek: number;
  /** 額外 CSS className */
  className?: string;
}

interface VoteData {
  yes: number;
  no: number;
  voted: "yes" | "no" | null;
}

function getStorageKey(movieId: string, theaterId: string, week: number) {
  return `moviebonus_vote_${movieId}_${theaterId}_${week}`;
}

function loadVote(key: string): VoteData {
  if (typeof window === "undefined") return { yes: 0, no: 0, voted: null };
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return { yes: 0, no: 0, voted: null };
}

function saveVote(key: string, data: VoteData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export default function BonusVote({
  movieId,
  theaterId,
  bonusWeek,
  className,
}: BonusVoteProps) {
  const key = getStorageKey(movieId, theaterId, bonusWeek);
  const [vote, setVote] = useState<VoteData>({ yes: 0, no: 0, voted: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setVote(loadVote(key));
    setMounted(true);
  }, [key]);

  const handleVote = useCallback(
    (choice: "yes" | "no") => {
      setVote((prev) => {
        if (prev.voted === choice) return prev; // already voted same
        const next = { ...prev };
        // Undo previous vote if switching
        if (prev.voted && prev.voted !== choice) {
          next[prev.voted] = Math.max(0, next[prev.voted] - 1);
        }
        if (!prev.voted || prev.voted !== choice) {
          next[choice] = next[choice] + 1;
          next.voted = choice;
        }
        saveVote(key, next);
        return next;
      });
    },
    [key]
  );

  if (!mounted) return null;

  const total = vote.yes + vote.no;
  const yesPercent = total > 0 ? Math.round((vote.yes / total) * 100) : 0;
  const noPercent = total > 0 ? 100 - yesPercent : 0;

  return (
    <div className={`flex items-center gap-2 mt-1.5 ${className ?? ""}`}>
      <span className="text-[10px] text-muted-foreground">還有嗎？</span>
      <button
        onClick={() => handleVote("yes")}
        className={`text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
          vote.voted === "yes"
            ? "bg-emerald-600/20 border-emerald-500 text-emerald-500 dark:text-emerald-400"
            : "bg-muted border-border text-muted-foreground hover:border-emerald-500/50"
        }`}
      >
        ✅ 還有{total > 0 ? ` ${yesPercent}%` : ""}
      </button>
      <button
        onClick={() => handleVote("no")}
        className={`text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
          vote.voted === "no"
            ? "bg-red-600/20 border-red-500 text-red-500 dark:text-red-400"
            : "bg-muted border-border text-muted-foreground hover:border-red-500/50"
        }`}
      >
        ❌ 沒了{total > 0 ? ` ${noPercent}%` : ""}
      </button>
      {total > 0 && (
        <span className="text-[10px] text-muted-foreground">({total} 票)</span>
      )}
    </div>
  );
}
