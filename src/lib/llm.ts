import "server-only";
import { logCost } from "./costs";

// Chat model through polza.ai (one key for many providers; DeepSeek by default). Every
// caller has a scripted fallback, so a missing key, an empty balance or a slow answer
// never breaks a page: chat() returns null and the caller goes on without the model.
//
// Reasoning is switched off explicitly: with only `effort: "none"` DeepSeek V4 sometimes
// writes its thinking into the answer (measured 2026-10-23), which a voice would read out.

const URL = process.env.POLZA_URL ?? "https://api.polza.ai/api/v1";
const KEY = process.env.POLZA_API_KEY ?? "";
const MODEL = process.env.LLM_MODEL ?? "deepseek/deepseek-v4.1-flash";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type Opts = { maxTokens?: number; temperature?: number; json?: boolean; timeoutMs?: number; signal?: AbortSignal; purpose?: string };

export function llmEnabled(): boolean {
  return !!KEY;
}

function body(messages: ChatMessage[], opts: Opts, stream: boolean) {
  return JSON.stringify({
    model: MODEL,
    messages,
    max_tokens: opts.maxTokens ?? 400,
    temperature: opts.temperature ?? 0.7,
    reasoning: { enabled: false },
    include_reasoning: false,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    ...(stream ? { stream: true, stream_options: { include_usage: true } } : {}),
  });
}

function signalFor(opts: Opts) {
  const timeout = AbortSignal.timeout(opts.timeoutMs ?? 15_000);
  return opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
}

export async function chat(messages: ChatMessage[], opts: Opts = {}): Promise<string | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(`${URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: body(messages, opts, false),
      signal: signalFor(opts),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("llm", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { cost_rub?: number } };
    logCost(opts.purpose ?? "llm", data.usage?.cost_rub);
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("llm", (e as Error).message);
    return null;
  }
}

/**
 * The same call as a stream: onDelta gets each piece of text as the model writes it.
 * Returns the whole answer, or null when the request failed before any text came.
 */
export async function chatStream(messages: ChatMessage[], onDelta: (piece: string) => void, opts: Opts = {}): Promise<string | null> {
  if (!KEY) return null;
  let text = "";
  try {
    const res = await fetch(`${URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: body(messages, opts, true),
      signal: signalFor(opts),
      cache: "no-store",
    });
    if (!res.ok || !res.body) {
      console.error("llm stream", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const d = JSON.parse(data) as { choices?: { delta?: { content?: string } }[]; usage?: { cost_rub?: number } };
          if (d.usage?.cost_rub) logCost(opts.purpose ?? "llm", d.usage.cost_rub);
          const piece = d.choices?.[0]?.delta?.content;
          if (piece) {
            text += piece;
            onDelta(piece);
          }
        } catch {
          /* a keep-alive or a broken line */
        }
      }
    }
    return text || null;
  } catch (e) {
    if ((e as Error).name !== "AbortError") console.error("llm stream", (e as Error).message);
    return text || null;
  }
}
