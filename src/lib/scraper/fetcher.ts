/**
 * 基礎爬蟲框架 — 用 fetch 抓取頁面 HTML
 *
 * Vercel serverless 相容，不依賴 Playwright。
 */

export interface FetchOptions {
  /** Request timeout in ms */
  timeout?: number;
  /** Custom User-Agent */
  userAgent?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Retry count on failure */
  retries?: number;
  /** Delay between retries in ms */
  retryDelay?: number;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_OPTIONS: Required<FetchOptions> = {
  timeout: 15000,
  userAgent: DEFAULT_USER_AGENT,
  headers: {},
  retries: 2,
  retryDelay: 1000,
};

export interface FetchResult {
  success: boolean;
  html: string;
  statusCode: number;
  url: string;
  finalUrl: string;
  fetchedAt: string;
  error?: string;
}

/**
 * Fetch a URL and return the HTML content
 */
export async function fetchPage(
  url: string,
  options?: FetchOptions
): Promise<FetchResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError = "";

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": opts.userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
          ...opts.headers,
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      const html = await response.text();

      return {
        success: response.ok,
        html,
        statusCode: response.status,
        url,
        finalUrl: response.url,
        fetchedAt: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (err) {
      lastError =
        err instanceof Error ? err.message : "Unknown fetch error";

      if (attempt < opts.retries) {
        await sleep(opts.retryDelay * (attempt + 1));
      }
    }
  }

  return {
    success: false,
    html: "",
    statusCode: 0,
    url,
    finalUrl: url,
    fetchedAt: new Date().toISOString(),
    error: lastError,
  };
}

/**
 * Fetch multiple pages with rate limiting
 */
export async function fetchPages(
  urls: string[],
  options?: FetchOptions & { concurrency?: number; delayBetween?: number }
): Promise<FetchResult[]> {
  const { concurrency = 2, delayBetween = 500, ...fetchOpts } = options || {};
  const results: FetchResult[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((url) => fetchPage(url, fetchOpts))
    );
    results.push(...batchResults);

    if (i + concurrency < urls.length) {
      await sleep(delayBetween);
    }
  }

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
