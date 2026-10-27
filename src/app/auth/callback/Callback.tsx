"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { finishSupabaseLogin } from "@/app/actions";

// Supabase puts the token into the URL hash, which never reaches the server on its own
export function Callback() {
  const [error, setError] = useState("");
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const token = hash.get("access_token");
    const next = new URLSearchParams(location.search).get("next") ?? "/app";
    history.replaceState(null, "", location.pathname);
    if (!token) { setError(hash.get("error_description") ?? "Google не вернул вход"); return; }
    finishSupabaseLogin(token, next).then((r) => r?.error && setError(r.error)).catch(() => {});
  }, []);
  if (!error) return <p className="text-muted">Входим…</p>;
  return (
    <div className="text-center">
      <p className="font-bold">{error}</p>
      <Link href="/login" className="btn btn-fire mt-4">Попробовать снова</Link>
    </div>
  );
}
