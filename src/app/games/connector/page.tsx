import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/games/ArcadeFrame";

export const metadata: Metadata = { title: "Connector Rush", description: "Игра на связки для IELTS Writing: пила едет на LexiUp, отталкивай её правильными linking words." };
export const dynamic = "force-static";

export default function Page() {
  return <ArcadeFrame src="/arcade/connector.html" title="Connector Rush" />;
}
