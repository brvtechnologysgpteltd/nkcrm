export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-6 py-5 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-black/40">
          Rendering
        </p>
        <p className="mt-2 text-xl font-semibold text-[var(--color-night)]">
          Loading dashboard...
        </p>
        <p className="mt-2 text-sm text-black/60">
          Fetching the latest metrics.
        </p>
      </div>
    </div>
  );
}
