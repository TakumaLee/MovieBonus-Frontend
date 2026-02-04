import { movies, getTheaterById } from "@/data/movies";
import Link from "next/link";
import type { Metadata } from "next";
import { getBonusCountdown, formatDate } from "@/lib/bonus-utils";

export const metadata: Metadata = {
  title: "歷史特典 | paruparu 啪嚕啪嚕",
  description: "已結束的台灣電影入場特典紀錄，按電影分組，標註結束日期。",
};

interface ExpiredBonus {
  movieId: string;
  movieTitle: string;
  theaterId: string;
  theaterName: string;
  week: number;
  description: string;
  quantity: string;
  expiryDate: string;
}

function getExpiredBonuses(): Map<string, ExpiredBonus[]> {
  const grouped = new Map<string, ExpiredBonus[]>();

  for (const movie of movies) {
    const expired: ExpiredBonus[] = [];

    for (const tb of movie.theaterBonuses) {
      for (const bonus of tb.bonuses) {
        const countdown = getBonusCountdown(movie.releaseDate, bonus.week);
        if (countdown.isExpired) {
          expired.push({
            movieId: movie.id,
            movieTitle: movie.title,
            theaterId: tb.theaterId,
            theaterName: tb.theaterName,
            week: bonus.week,
            description: bonus.description,
            quantity: bonus.quantity,
            expiryDate: formatDate(countdown.expiryDate),
          });
        }
      }
    }

    if (expired.length > 0) {
      grouped.set(movie.id, expired);
    }
  }

  return grouped;
}

export default function HistoryPage() {
  const expiredByMovie = getExpiredBonuses();
  const totalExpired = Array.from(expiredByMovie.values()).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 mb-6"
      >
        ← 回到首頁
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          歷史特典
        </span>
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        已結束的入場特典紀錄，共 {totalExpired} 個特典
      </p>

      {expiredByMovie.size === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-400">目前沒有已結束的特典</p>
          <p className="text-sm text-gray-500 mt-1">
            所有特典都還在進行中！
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-sm text-amber-400 hover:text-amber-300"
          >
            查看進行中的特典 →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(expiredByMovie.entries()).map(([movieId, bonuses]) => {
            const movie = movies.find((m) => m.id === movieId);
            if (!movie) return null;

            return (
              <div
                key={movieId}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Movie header */}
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/movie/${movieId}`}
                      className="font-bold hover:text-amber-400 transition-colors"
                    >
                      {movie.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      上映日：{movie.releaseDate}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-500">
                    {bonuses.length} 個已結束
                  </span>
                </div>

                {/* Expired bonuses */}
                <div className="divide-y divide-gray-800">
                  {bonuses.map((bonus, idx) => {
                    const theater = getTheaterById(bonus.theaterId);
                    return (
                      <div
                        key={idx}
                        className="px-4 py-3 flex items-start gap-3 opacity-60"
                      >
                        <div
                          className="shrink-0 w-1 h-full min-h-[2rem] rounded-full"
                          style={{
                            backgroundColor: theater?.color || "#666",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
                              {bonus.theaterName}
                            </span>
                            <span className="text-xs text-gray-600">
                              第 {bonus.week} 週
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {bonus.description}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            結束日：{bonus.expiryDate}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-600">
                          已結束
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
