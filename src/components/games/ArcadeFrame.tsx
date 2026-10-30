// Full-screen wrapper for the standalone arcade pages in /public/arcade:
// the game owns the whole viewport (its own header, HUD and overlays), so we
// drop the site chrome and stretch an iframe over it.
export function ArcadeFrame({ src, title }: { src: string; title: string }) {
  return (
    <main className="fixed inset-0 z-0 bg-bg">
      <iframe
        src={src}
        title={title}
        className="block h-full w-full border-0"
        allow="microphone; autoplay; speech-recognition; fullscreen"
      />
    </main>
  );
}
