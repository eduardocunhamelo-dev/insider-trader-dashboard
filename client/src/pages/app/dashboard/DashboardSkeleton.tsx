export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" data-testid="dashboard-skeleton">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
      </div>

      {/* Metric cards skeleton — 7 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-5 space-y-3">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-7 w-36 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border border-white/[0.06] p-5">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="h-72 sm:h-80 w-full bg-muted rounded" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-white/[0.06] p-5 space-y-3">
        <div className="h-4 w-24 bg-muted rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-full bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}
