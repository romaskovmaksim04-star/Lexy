// Skeleton in the shape of an app page while the server renders it.
export default function Loading() {
  return (
    <div className="grid animate-pulse gap-6 calm:animate-none" aria-busy="true" aria-label="Загрузка">
      <div className="h-10 w-2/3 rounded-2xl bg-surface-2" />
      <div className="h-40 rounded-[2rem] bg-surface-2" />
      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-3xl bg-surface-2" />)}
      </div>
    </div>
  );
}
