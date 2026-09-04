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
  challenger: "Qwen/Qwen3.8-27B:fastest",
  judge: "zai-org/GLM-5.3:fastest",
} as const;

export function huggingFaceConfigured() {
  return Boolean(process.env.HF_TOKEN);
}

async function invokeModel(
  token: string,
  model: string,
  input: string,
  maxTokens: number,
  temperature: number,
): Promise<HuggingFaceChatResult> {
  const response = await fetchJsonWithRetry<ChatCompletionBody>("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: input }],
      max_tokens: maxTokens,
      temperature,
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

export async function huggingFaceChat(
  input: string,
  options: {
    purpose?: "generation" | "challenger" | "judge";
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {},
): Promise<HuggingFaceChatResult> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("Hugging Face inference is not configured.");

  const purpose = options.purpose ?? "generation";
  const maxTokens = options.maxTokens ?? 900;
  const temperature = options.temperature ?? (purpose === "judge" ? 0 : 0.35);
  const primaryModel = options.model ?? HUGGING_FACE_MODELS[purpose];

  try {
    return await invokeModel(token, primaryModel, input, maxTokens, temperature);
  } catch (primaryError) {
    // For creative/generative work, route across two independent popular open-model families before giving up.
    if (!options.model && purpose === "generation" && primaryModel !== HUGGING_FACE_MODELS.challenger) {
      return invokeModel(token, HUGGING_FACE_MODELS.challenger, input, maxTokens, temperature);
    }
    throw primaryError;
  }
}
