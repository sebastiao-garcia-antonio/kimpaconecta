export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-9 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-3 h-3 w-40 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-56 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((__, row) => (
                  <div key={row} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
