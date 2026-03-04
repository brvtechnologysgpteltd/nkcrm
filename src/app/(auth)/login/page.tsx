import LoginForm from "@/app/(auth)/login/login-form";
import { query } from "@/lib/db";

type TodaySummary = {
  total: number | null;
  receipts: number | null;
};

type ServiceRow = {
  cdesc: string;
  total: number;
};

const currency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export default async function LoginPage() {
  const [todaySummary] = await query<TodaySummary>(
    `
    SELECT
      SUM(ngtotal) AS total,
      COUNT(*) AS receipts
    FROM Pos.tblSalesMain
    WHERE ddate = CAST(GETDATE() AS date)
    `
  );

  const [currentTopService] = await query<ServiceRow>(
    `
    SELECT TOP (1)
      e.cdesc,
      SUM(e.namt) AS total
    FROM Pos.tblSalesEntry e
    WHERE e.ddate >= CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE()))
      AND e.ddate < DATEADD(month, 1, CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())))
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
      AND e.lservice = 1
    GROUP BY e.cdesc
    ORDER BY total DESC
    `
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-[var(--color-night)] p-10 text-white shadow-2xl">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" />
              Salon CRM Suite
            </div>
            <h1 className="text-4xl leading-tight">NK Hairworks CRM</h1>
            <p className="text-white/75">
              Manage bookings, stylists, services, and retail sales in one calm,
              tailored workspace.
            </p>
            <div className="grid gap-4 text-sm">
              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-white/70">Today</p>
                <p className="text-lg font-semibold">
                  {todaySummary?.receipts ?? 0} receipts ·{" "}
                  {currency.format(todaySummary?.total ?? 0)} sales
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-white/70">Top service</p>
                <p className="text-lg font-semibold">
                  {currentTopService?.cdesc || "No data"}
                </p>
                <p className="text-sm text-white/70">
                  {currentTopService
                    ? currency.format(currentTopService.total)
                    : "No data"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
