"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, X } from "@phosphor-icons/react";

// The latest notice from the admin panel; closing it is remembered in this browser
export function NoticeBar({ id, text, link }: { id: string; text: string; link: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    try { setShown(localStorage.getItem("lexy_notice") !== id); } catch { setShown(true); }
  }, [id]);
  if (!shown) return null;
  const close = () => { setShown(false); try { localStorage.setItem("lexy_notice", id); } catch {} };
  const body = <><Megaphone size={20} weight="fill" className="shrink-0" /><span className="flex-1 font-semibold">{text}</span></>;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-fire-soft px-4 py-3 text-fire-text">
      {link ? (link.startsWith("/") ? <Link href={link} className="flex flex-1 items-center gap-3">{body}</Link> : <a href={link} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center gap-3">{body}</a>) : body}
      <button onClick={close} aria-label="Закрыть" className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/30"><X size={16} weight="bold" /></button>
    </div>
  );
}
