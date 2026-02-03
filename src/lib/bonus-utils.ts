/**
 * 特典倒數計算工具
 *
 * 根據 releaseDate + week 計算特典到期日
 * 假設每週特典持續 7 天
 */

export interface BonusCountdown {
  /** 剩餘天數（負數代表已過期） */
  daysRemaining: number;
  /** 是否已過期 */
  isExpired: boolean;
  /** 是否快到期（< 3 天） */
  isUrgent: boolean;
  /** 到期日 */
  expiryDate: Date;
  /** 顯示文字 */
  label: string;
}

/**
 * 計算特典到期日
 * @param releaseDate 電影上映日（YYYY-MM-DD）
 * @param week 特典週次（1-based）
 * @returns 該週特典的最後一天
 */
export function getBonusExpiryDate(releaseDate: string, week: number): Date {
  const release = new Date(releaseDate + "T00:00:00+08:00"); // 台灣時區
  // 第 N 週特典 = 上映日 + (N * 7) 天後結束
  const expiryDate = new Date(release);
  expiryDate.setDate(expiryDate.getDate() + week * 7);
  return expiryDate;
}

/**
 * 取得特典倒數資訊
 * @param releaseDate 電影上映日（YYYY-MM-DD）
 * @param week 特典週次
 * @param now 參考日期（預設為現在）
 */
export function getBonusCountdown(
  releaseDate: string,
  week: number,
  now?: Date
): BonusCountdown {
  const currentDate = now || new Date();
  const expiryDate = getBonusExpiryDate(releaseDate, week);

  const diffMs = expiryDate.getTime() - currentDate.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpired = daysRemaining <= 0;
  const isUrgent = !isExpired && daysRemaining <= 3;

  let label: string;
  if (isExpired) {
    label = "已結束";
  } else if (daysRemaining === 1) {
    label = "最後 1 天";
  } else {
    label = `剩餘 ${daysRemaining} 天`;
  }

  return {
    daysRemaining,
    isExpired,
    isUrgent,
    expiryDate,
    label,
  };
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}