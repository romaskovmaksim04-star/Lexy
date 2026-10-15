import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import "./globals.css";

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
  title: { default: "Lexy: нужный балл IELTS с первой попытки", template: "%s · Lexy" },
  description:
    "Подготовка к IELTS Academic и General Training: план на каждый день, тренажёры Listening, Reading, Writing и Speaking с разбором ответов.",
  openGraph: {
    title: "Lexy: нужный балл IELTS с первой попытки",
    description: "План на каждый день и тренажёры всех четырёх секций IELTS с разбором ответов.",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5fc" },
    { media: "(prefers-color-scheme: dark)", color: "#110d1f" },
  ],
};

// Sets the theme before first paint: saved choice first, then the system setting.
const themeScript = `(function(){try{var t=localStorage.getItem("lexy-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${unbounded.variable} ${onest.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain min-h-[100dvh] antialiased">{children}</body>
    </html>
  );
}
