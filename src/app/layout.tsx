import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import "./globals.css";
import { Interactions } from "@/components/fx/Interactions";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "LexiUp: нужный балл IELTS с первой попытки", template: "%s · LexiUp" },
  description:
    "Подготовка к IELTS Academic и General Training: план на каждый день, тренажёры Listening, Reading, Writing и Speaking с разбором ответов.",
  openGraph: {
    title: "LexiUp: нужный балл IELTS с первой попытки",
    description: "План на каждый день и тренажёры всех четырёх секций IELTS с разбором ответов.",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f5fc",
};

// Sets the theme and the animation switch before first paint: saved choice first, then
// the system colour scheme. Animations are on unless switched off on the site.
const themeScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("lexy-theme");if(t!=="light"&&t!=="dark"){t="light"}d.dataset.theme=t;d.dataset.motion=localStorage.getItem("lexy-motion")==="off"?"off":"on"}catch(e){d.dataset.theme="light";d.dataset.motion="on"}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${unbounded.variable} ${onest.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain min-h-[100dvh] antialiased">
        {children}
        <Interactions />
      </body>
    </html>
  );
}
