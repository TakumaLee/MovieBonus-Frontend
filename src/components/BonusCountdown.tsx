"use client";

import { getBonusCountdown } from "@/lib/bonus-utils";

interface BonusCountdownProps {
  releaseDate: string;
  week: number;
  className?: string;
}

export default function BonusCountdown({
  releaseDate,
  week,
  className,
}: BonusCountdownProps) {
  const countdown = getBonusCountdown(releaseDate, week);

  if (countdown.isExpired) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground ${className ?? ""}`}>
        已結束
      </span>
    );
  }

  if (countdown.isUrgent) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 animate-pulse ${className ?? ""}`}>
        {countdown.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/30 ${className ?? ""}`}>
      {countdown.label}
    </span>
  );
}