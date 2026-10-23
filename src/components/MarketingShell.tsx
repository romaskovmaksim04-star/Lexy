import { currentUser } from "@/lib/auth";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { EmberSky } from "@/components/landing/EmberSky";

/** Header, footer and the ember background for public pages. */
export async function MarketingShell({ children, fire = true }: { children: React.ReactNode; fire?: boolean }) {
  const user = await currentUser();
  return (
    <>
      {fire && <EmberSky />}
      <Header signedIn={!!user} />
      <main className="min-h-[70dvh]">{children}</main>
      <Footer />
    </>
  );
}
