import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { ConnectorRush } from "./ConnectorRush";

export const metadata: Metadata = { title: "Connector Rush", description: "Игра на связки для IELTS Writing: выбери правильный linking word за 5 секунд." };

export default function Page() {
  return (
    <MarketingShell fire={false}>
      <section className="px-4 pb-24 pt-10 md:px-8 md:pt-16"><ConnectorRush /></section>
    </MarketingShell>
  );
}
