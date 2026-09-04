import type { Evidence } from "./types";

const INJECTION_PATTERNS = [
  /ignore\s+(all|any|the)?\s*(previous|prior|system)\s+instructions/i,
  /system\s*prompt/i,
  /delete[_\s-]+production/i,
  /run\s*:\s*[a-z_]+\(/i,
  /override\s+(policy|guardrail|authorization)/i,
  /you\s+are\s+now\s+(authorized|admin|root)/i,
];

export function detectPromptInjection(text: string): { flagged: boolean; signals: string[] } {
  const signals = INJECTION_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return { flagged: signals.length > 0, signals };
}

export function sanitizeUntrustedText(text: string): { safeText: string; flagged: boolean } {
  const detection = detectPromptInjection(text);
  if (!detection.flagged) return { safeText: text, flagged: false };
  return {
    safeText: `[UNTRUSTED CONTENT FLAGGED AS POSSIBLE PROMPT INJECTION] ${text}`,
    flagged: true,
  };
}

export function countInjectionSignals(evidence: Evidence[]): number {
  return evidence.reduce((count, item) => count + (detectPromptInjection(item.detail).flagged ? 1 : 0), 0);
}
