import "server-only";

// Messages to the owners' Telegram (the same bot Ghostly uses for its own notices).
// Fire and forget: a Telegram hiccup never breaks a sign-up or a payment.

export function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function notifyOwners(html: string): void {
  const token = process.env.TG_NOTIFY_TOKEN;
  const chats = (process.env.TG_NOTIFY_CHATS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return;
  const text = `🔥 GoLexi · ${html}`.slice(0, 4000);
  for (const chat_id of chats) {
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {});
  }
}
