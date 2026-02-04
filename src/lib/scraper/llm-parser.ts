/**
 * LLM 解析模組 — 使用 Anthropic Claude API 將 HTML 轉成標準化特典 JSON
 *
 * 用 claude-haiku 理解非結構化的網頁內容，輸出統一格式的特典資料。
 * 環境變數：ANTHROPIC_API_KEY
 *
 * 注意：此模組與正式版的 Genkit AI（Google AI）互補，
 * Genkit 用於前端互動式查詢，此模組用於批次爬蟲解析。
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedBonus, LLMParseRequest, LLMParseResponse } from "./types";

// ============================================================
// Prompt Templates
// ============================================================

export const BONUS_EXTRACTION_PROMPT = `你是一個專門分析台灣電影院特典資訊的 AI 助手。

## 任務
請從以下 HTML 內容中，提取電影入場特典（來場者特典/入場禮）的資訊。

## 影城
{{theaterName}}（ID: {{theaterId}}）

## 來源網址
{{sourceUrl}}

## 今天日期
{{today}}

## 輸出格式
請以 JSON 陣列格式輸出，每個特典物品一個 object：

\`\`\`json
[
  {
    "movieTitle": "電影名稱",
    "theaterName": "影城名稱",
    "week": 1,
    "description": "特典描述，例如：角色特製色紙",
    "quantity": "數量說明，例如：每場次前 30 名",
    "sourceUrl": "來源網址",
    "confidence": 0.8,
    "dateRelevance": "recent"
  }
]
\`\`\`

## 重要注意事項
1. week 表示第幾週特典，如果無法判斷就填 1
2. 如果看不出數量限制，quantity 填 "數量有限，送完為止"
3. 只提取「入場特典」「來場者特典」「購票贈品」，不包含周邊商品販售
4. 如果 HTML 中沒有特典資訊，回傳空陣列 []
5. 不要編造不存在的資訊
6. **日期檢查**：仔細檢查內容中的日期，只提取最近 3 個月內的資訊。如果內容明顯是舊文章（超過 3 個月前），跳過不提取。
7. **重映電影判別**：如果電影是重映/再上映/4K修復/IMAX紀念版等，請特別注意：
   - 區分「原版上映」和「重映版」的資訊
   - 只提取重映版的最新特典，不要提取原版上映時的舊特典
   - 重映相關關鍵字：重映、再上映、4K、IMAX、數位修復、經典回歸、重返大銀幕、紀念版
8. **confidence** 欄位（0-1）：你對此資訊正確性的信心程度
   - 0.9-1.0：官方來源、明確標示的最新資訊
   - 0.6-0.8：可信但需驗證（如新聞報導、非官方來源）
   - 0.3-0.5：不太確定（資訊模糊、日期不明）
   - 0-0.2：很可能是過時資訊
9. **dateRelevance** 欄位：
   - "recent"：確認是最近的資訊（3 個月內）
   - "uncertain"：無法判斷日期
   - "outdated"：明確是舊資訊（超過 3 個月）— 這類請不要提取

## HTML 內容
{{html}}
`;

/**
 * 填入 prompt template 的變數
 */
export function buildPrompt(request: LLMParseRequest): string {
  let prompt = request.promptTemplate || BONUS_EXTRACTION_PROMPT;

  // 截斷過長的 HTML（保留前 8000 字元）
  const maxHtmlLength = 8000;
  const html =
    request.html.length > maxHtmlLength
      ? request.html.slice(0, maxHtmlLength) + "\n... [已截斷]"
      : request.html;

  prompt = prompt.replace("{{html}}", html);
  prompt = prompt.replace("{{sourceUrl}}", request.sourceUrl);
  prompt = prompt.replace("{{theaterId}}", request.theaterId);
  prompt = prompt.replace("{{today}}", new Date().toISOString().split("T")[0]);

  const theaterNames: Record<string, string> = {
    vieshow: "威秀影城",
    ambassador: "國賓影城",
    showtimes: "秀泰影城",
    miramar: "美麗華影城",
    in89: "in89 豪華數位影城",
  };
  prompt = prompt.replace(
    "{{theaterName}}",
    theaterNames[request.theaterId] || request.theaterId
  );

  return prompt;
}

/**
 * 解析 LLM 回應，提取 JSON 陣列
 */
export function parseLLMResponse(
  rawResponse: string,
  sourceUrl: string
): LLMParseResponse {
  try {
    const jsonMatch = rawResponse.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return {
        bonuses: [],
        confidence: 0,
        rawResponse,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<ScrapedBonus>[];
    const now = new Date().toISOString();

    // Filter out items marked as outdated by LLM
    const filteredParsed = parsed.filter((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dateRelevance = (item as any).dateRelevance;
      if (dateRelevance === "outdated") return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemConfidence = (item as any).confidence;
      if (typeof itemConfidence === "number" && itemConfidence < 0.3) return false;
      return true;
    });

    const bonuses: ScrapedBonus[] = filteredParsed
      .filter((item) => item.movieTitle && item.description)
      .map((item) => ({
        movieTitle: item.movieTitle || "",
        theaterName: item.theaterName || "",
        week: item.week || 1,
        description: item.description || "",
        quantity: item.quantity || "數量有限，送完為止",
        sourceUrl: item.sourceUrl || sourceUrl,
        scrapedAt: now,
      }));

    // Use average confidence from LLM if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const confidences = filteredParsed.map((item) => (item as any).confidence).filter((c: unknown) => typeof c === "number") as number[];
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
      : bonuses.length > 0 ? 0.7 : 0;

    return {
      bonuses,
      confidence: avgConfidence,
      rawResponse,
    };
  } catch {
    return {
      bonuses: [],
      confidence: 0,
      rawResponse,
    };
  }
}

// ============================================================
// Anthropic Client (lazy init)
// ============================================================

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[LLM Parser] ANTHROPIC_API_KEY is not set. Please add it to your environment."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/**
 * 呼叫 Anthropic Claude API 解析 HTML 特典資訊
 *
 * 使用 claude-haiku 模型（快速且低成本）
 */
export async function parseWithLLM(
  request: LLMParseRequest
): Promise<LLMParseResponse> {
  const prompt = buildPrompt(request);

  try {
    const client = getClient();

    console.log(
      `[LLM Parser] Calling Claude Haiku for ${request.theaterId}, prompt length: ${prompt.length}`
    );

    const message = await client.messages.create({
      model: "claude-haiku-4-20250414",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawResponse = textBlock ? textBlock.text : "";

    console.log(
      `[LLM Parser] Response received, length: ${rawResponse.length}`
    );

    return parseLLMResponse(rawResponse, request.sourceUrl);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[LLM Parser] API call failed: ${errorMsg}`);

    return {
      bonuses: [],
      confidence: 0,
      rawResponse: `[ERROR] ${errorMsg}`,
    };
  }
}
