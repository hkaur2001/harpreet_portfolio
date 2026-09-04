import { fetchJsonWithRetry } from "@/lib/resilient-fetch";

export type HuggingFaceChatResult = {
  text: string;
  model: string;
  retries: number;
  inputTokens: number;
  outputTokens: number;
};

type ChatCompletionBody = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export const HUGGING_FACE_MODELS = {
  generation: "deepseek-ai/DeepSeek-V4-Flash-0731:fastest",
  judge: "zai-org/GLM-5.3:fastest",
} as const;

export function huggingFaceConfigured() {
  return Boolean(process.env.HF_TOKEN);
}

export async function huggingFaceChat(
  input: string,
  options: { purpose?: "generation" | "judge"; maxTokens?: number; temperature?: number } = {},
): Promise<HuggingFaceChatResult> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("Hugging Face inference is not configured.");

  const purpose = options.purpose ?? "generation";
  const model = purpose === "judge" ? HUGGING_FACE_MODELS.judge : HUGGING_FACE_MODELS.generation;
  const response = await fetchJsonWithRetry<ChatCompletionBody>("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: input }],
      max_tokens: options.maxTokens ?? 900,
      temperature: options.temperature ?? (purpose === "judge" ? 0 : 0.35),
    }),
  }, { attempts: 3, baseDelayMs: 300, maxDelayMs: 1800, timeoutMs: 35_000 });

  const text = response.data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Hugging Face model returned an empty response.");

  return {
    text,
    model,
    retries: response.retries,
    inputTokens: response.data.usage?.prompt_tokens ?? 0,
    outputTokens: response.data.usage?.completion_tokens ?? 0,
  };
}
