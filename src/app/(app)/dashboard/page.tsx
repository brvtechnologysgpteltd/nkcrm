import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type TodaySummary = {
  total: number | null;
  receipts: number | null;
  avgTicket: number | null;
};

type MonthSummary = {
  currentTotal: number | null;
  previousTotal: number | null;
};

type ServiceRow = {
  cdesc: string;
  total: number;
};

type MonthRow = {
  year: number;
  month: number;
  total: number;
};

type SignupSummary = {
  todayCount: number | null;
  monthCount: number | null;
};

type SignupMonthRow = {
  year: number;
  month: number;
  total: number;
};

type PackageMonthRow = {
  year: number;
  month: number;
  sales: number;
  redeem: number;
};

type PackageNormalMonthRow = {
  year: number;
  month: number;
  packageSales: number;
  normalSales: number;
};

type WalkInSummary = {
  memberSales: number | null;
  walkInSales: number | null;
};

type WalkInMonthRow = {
  year: number;
  month: number;
  memberSales: number;
  walkInSales: number;
};

type LocationMonthRow = {
  locationCode: string;
  locationName: string;
  year: number;
  month: number;
  total: number;
};

type LocationPeakDayRow = {
  locationCode: string;
  locationName: string | null;
  weekdayName: string;
  total: number;
};

type LocationPeakTopDayRow = {
  locationCode: string;
  locationName: string | null;
  weekdayName: string;
  total: number;
  rank: number;
};

type LocationTopRow = {
  locationCode: string;
  locationName: string | null;
  itemName: string;
  total: number;
};

const currency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const maxLabelLength = 34;

function truncateFromEnd(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

export default async function DashboardPage() {
  const [todaySummary] = await query<TodaySummary>(
    `
    SELECT
      SUM(ngtotal) AS total,
      COUNT(*) AS receipts,
      CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(ngtotal) / COUNT(*) END AS avgTicket
    FROM Pos.tblSalesMain
    WHERE ddate = CAST(GETDATE() AS date)
    `
  );

  const [monthSummary] = await query<MonthSummary>(
    `
    SELECT
      (SELECT SUM(ngtotal)
       FROM Pos.tblSalesMain
       WHERE ddate >= CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE()))
         AND ddate < DATEADD(month, 1, CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())))
      ) AS currentTotal,
      (SELECT SUM(ngtotal)
       FROM Pos.tblSalesMain
       WHERE ddate >= DATEADD(month, -1, CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())))
         AND ddate < CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE()))
      ) AS previousTotal
    `
  );

  const [walkInSummary] = await query<WalkInSummary>(
    `
    SELECT
      SUM(CASE WHEN ISNULL(LTRIM(RTRIM(m.cmembercode)), '') <> '' THEN e.ntotal ELSE 0 END) AS memberSales,
      SUM(CASE WHEN ISNULL(LTRIM(RTRIM(m.cmembercode)), '') = '' THEN e.ntotal ELSE 0 END) AS walkInSales
    FROM Pos.tblSalesEntry e
    INNER JOIN Pos.tblSalesMain m ON m.id = e.nidsalesmain
    WHERE m.ddate = CAST(GETDATE() AS date)
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
    `
  );

  const monthlyWalkInComparison = await query<WalkInMonthRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    )
    SELECT
      YEAR(m.ddate) AS year,
      MONTH(m.ddate) AS month,
      SUM(CASE WHEN ISNULL(LTRIM(RTRIM(m.cmembercode)), '') <> '' THEN e.ntotal ELSE 0 END) AS memberSales,
      SUM(CASE WHEN ISNULL(LTRIM(RTRIM(m.cmembercode)), '') = '' THEN e.ntotal ELSE 0 END) AS walkInSales
    FROM Pos.tblSalesEntry e
    INNER JOIN Pos.tblSalesMain m ON m.id = e.nidsalesmain
    CROSS JOIN month_base mb
    WHERE m.ddate >= DATEADD(month, -11, mb.month_start)
      AND m.ddate < DATEADD(month, 1, mb.month_start)
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
    GROUP BY YEAR(m.ddate), MONTH(m.ddate)
    ORDER BY YEAR(m.ddate), MONTH(m.ddate)
    `
  );

  const monthlyLocationPerformance = await query<LocationMonthRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    ),
    location_totals AS (
      SELECT
        m.clocationcode,
        SUM(e.ntotal) AS total
      FROM Pos.tblSalesEntry e
      INNER JOIN Pos.tblSalesMain m ON m.id = e.nidsalesmain
      CROSS JOIN month_base mb
    WHERE m.ddate >= DATEADD(month, -5, mb.month_start)
      AND m.ddate < DATEADD(month, 1, mb.month_start)
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
    GROUP BY m.clocationcode
    HAVING SUM(e.ntotal) > 0
    )
    SELECT
      e.clocationcode AS locationCode,
      s.clocationname AS locationName,
      YEAR(m.ddate) AS year,
      MONTH(m.ddate) AS month,
      SUM(e.ntotal) AS total
    FROM Pos.tblSalesEntry e
    INNER JOIN Pos.tblSalesMain m ON m.id = e.nidsalesmain
    LEFT JOIN Pos.tblSettings s ON s.clocationcode = e.clocationcode
    INNER JOIN location_totals lt ON lt.clocationcode = e.clocationcode
    CROSS JOIN month_base mb
    WHERE m.ddate >= DATEADD(month, -5, mb.month_start)
      AND m.ddate < DATEADD(month, 1, mb.month_start)
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
    GROUP BY e.clocationcode, s.clocationname, YEAR(m.ddate), MONTH(m.ddate)
    ORDER BY e.clocationcode, YEAR(m.ddate), MONTH(m.ddate)
    `
  );

  const peakDayByLocation = await query<LocationPeakDayRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    ),
    location_days AS (
      SELECT
        m.clocationcode AS locationCode,
        s.clocationname AS locationName,
        DATENAME(WEEKDAY, m.ddate) AS weekdayName,
        SUM(m.ngtotal) AS total,
        ROW_NUMBER() OVER (
          PARTITION BY m.clocationcode
          ORDER BY SUM(m.ngtotal) DESC
        ) AS rank
      FROM Pos.tblSalesMain m
      LEFT JOIN Pos.tblSettings s ON s.clocationcode = m.clocationcode
      CROSS JOIN month_base mb
      WHERE m.ddate >= DATEADD(month, -2, mb.month_start)
        AND m.ddate < DATEADD(month, 1, mb.month_start)
      GROUP BY m.clocationcode, s.clocationname, DATENAME(WEEKDAY, m.ddate)
    )
    SELECT locationCode, locationName, weekdayName, total
    FROM location_days
    WHERE rank = 1
    ORDER BY total DESC, locationName, locationCode
    `
  );

  const topDaysByLocation = await query<LocationPeakTopDayRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    ),
    location_days AS (
      SELECT
        m.clocationcode AS locationCode,
        s.clocationname AS locationName,
        DATENAME(WEEKDAY, m.ddate) AS weekdayName,
        SUM(m.ngtotal) AS total,
        ROW_NUMBER() OVER (
          PARTITION BY m.clocationcode
          ORDER BY SUM(m.ngtotal) DESC
        ) AS rank
      FROM Pos.tblSalesMain m
      LEFT JOIN Pos.tblSettings s ON s.clocationcode = m.clocationcode
      CROSS JOIN month_base mb
      WHERE m.ddate >= DATEADD(month, -2, mb.month_start)
        AND m.ddate < DATEADD(month, 1, mb.month_start)
      GROUP BY m.clocationcode, s.clocationname, DATENAME(WEEKDAY, m.ddate)
    )
    SELECT locationCode, locationName, weekdayName, total, rank
    FROM location_days
    ORDER BY locationName, locationCode, rank
    `
  );

  const topServiceByLocation = await query<LocationTopRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    ),
    location_service AS (
      SELECT
        e.clocationcode AS locationCode,
        s.clocationname AS locationName,
        e.cdesc AS itemName,
        SUM(e.namt) AS total,
        ROW_NUMBER() OVER (
          PARTITION BY e.clocationcode
          ORDER BY SUM(e.namt) DESC
        ) AS rank
      FROM Pos.tblSalesEntry e
      INNER JOIN Pos.tblSalesMain m ON m.id = e.nidsalesmain
      LEFT JOIN Pos.tblSettings s ON s.clocationcode = e.clocationcode
      CROSS JOIN month_base mb
      WHERE e.lservice = 1
        AND m.ddate >= DATEADD(month, -2, mb.month_start)
        AND m.ddate < DATEADD(month, 1, mb.month_start)
        AND ISNULL(e.cancelled, 0) = 0
        AND ISNULL(e.void, 0) = 0
      GROUP BY e.clocationcode, s.clocationname, e.cdesc
    )
    SELECT locationCode, locationName, itemName, total
    FROM location_service
    WHERE rank = 1
    ORDER BY total DESC, locationName, locationCode
    `
  );

  const topProductByLocation = await query<LocationTopRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    ),
    location_product AS (
      SELECT
        e.clocationcode AS locationCode,
        s.clocationname AS locationName,
        e.cdesc AS itemName,
        SUM(e.namt) AS total,
        ROW_NUMBER() OVER (
          PARTITION BY e.clocationcode
          ORDER BY SUM(e.namt) DESC
        ) AS rank
      FROM Pos.tblSalesEntry e
      INNER JOIN Pos.tblSalesMain m ON m.id = e.nidsalesmain
      LEFT JOIN Pos.tblSettings s ON s.clocationcode = e.clocationcode
      CROSS JOIN month_base mb
      WHERE (e.lservice = 0 OR e.lservice IS NULL)
        AND m.ddate >= DATEADD(month, -2, mb.month_start)
        AND m.ddate < DATEADD(month, 1, mb.month_start)
        AND ISNULL(e.cancelled, 0) = 0
        AND ISNULL(e.void, 0) = 0
      GROUP BY e.clocationcode, s.clocationname, e.cdesc
    )
    SELECT locationCode, locationName, itemName, total
    FROM location_product
    WHERE rank = 1
    ORDER BY total DESC, locationName, locationCode
    `
  );

  const [signupSummary] = await query<SignupSummary>(
    `
    SELECT
      (SELECT COUNT(*)
       FROM Membership.tblMembers
       WHERE CAST(dtMember_JoinedDate AS date) = CAST(GETDATE() AS date)
      ) AS todayCount,
      (SELECT COUNT(*)
       FROM Membership.tblMembers
       WHERE dtMember_JoinedDate >= CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE()))
         AND dtMember_JoinedDate < DATEADD(month, 1, CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())))
      ) AS monthCount
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

  const [previousTopService] = await query<ServiceRow>(
    `
    SELECT TOP (1)
      e.cdesc,
      SUM(e.namt) AS total
    FROM Pos.tblSalesEntry e
    WHERE e.ddate >= DATEADD(month, -1, CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())))
      AND e.ddate < CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE()))
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
      AND e.lservice = 1
    GROUP BY e.cdesc
    ORDER BY total DESC
    `
  );

  const currentTopProducts: ServiceRow[] = await query<ServiceRow>(
    `
    SELECT TOP (5)
      e.cdesc,
      SUM(e.namt) AS total
    FROM Pos.tblSalesEntry e
    WHERE e.ddate >= CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE()))
      AND e.ddate < DATEADD(month, 1, CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())))
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
      AND (e.lservice = 0 OR e.lservice IS NULL)
    GROUP BY e.cdesc
    ORDER BY total DESC
    `
  );

  const previousTopProducts: ServiceRow[] = await query<ServiceRow>(
    `
    SELECT TOP (5)
      e.cdesc,
      SUM(e.namt) AS total
    FROM Pos.tblSalesEntry e
    WHERE e.ddate >= DATEADD(month, -1, CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())))
      AND e.ddate < CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE()))
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
      AND (e.lservice = 0 OR e.lservice IS NULL)
    GROUP BY e.cdesc
    ORDER BY total DESC
    `
  );

  const monthlySales = await query<MonthRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    )
    SELECT
      YEAR(m.ddate) AS year,
      MONTH(m.ddate) AS month,
      SUM(m.ngtotal) AS total
    FROM Pos.tblSalesMain m
    CROSS JOIN month_base mb
    WHERE m.ddate >= DATEADD(month, -11, mb.month_start)
      AND m.ddate < DATEADD(month, 1, mb.month_start)
    GROUP BY YEAR(m.ddate), MONTH(m.ddate)
    ORDER BY YEAR(m.ddate), MONTH(m.ddate)
    `
  );

  const monthlySignups = await query<SignupMonthRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    )
    SELECT
      YEAR(m.dtMember_JoinedDate) AS year,
      MONTH(m.dtMember_JoinedDate) AS month,
      COUNT(*) AS total
    FROM Membership.tblMembers m
    CROSS JOIN month_base mb
    WHERE m.dtMember_JoinedDate >= DATEADD(month, -11, mb.month_start)
      AND m.dtMember_JoinedDate < DATEADD(month, 1, mb.month_start)
    GROUP BY YEAR(m.dtMember_JoinedDate), MONTH(m.dtMember_JoinedDate)
    ORDER BY YEAR(m.dtMember_JoinedDate), MONTH(m.dtMember_JoinedDate)
    `
  );

  const monthlyPackageComparison = await query<PackageMonthRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    )
    SELECT
      YEAR(e.ddate) AS year,
      MONTH(e.ddate) AS month,
      SUM(CASE WHEN LTRIM(RTRIM(e.citem)) = '4000001' THEN 1 ELSE 0 END) AS sales,
      SUM(CASE WHEN LTRIM(RTRIM(e.citem)) = '4000002' THEN 1 ELSE 0 END) AS redeem
    FROM Pos.tblSalesEntry e
    CROSS JOIN month_base mb
    WHERE e.ddate >= DATEADD(month, -11, mb.month_start)
      AND e.ddate < DATEADD(month, 1, mb.month_start)
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
      AND LTRIM(RTRIM(e.citem)) IN ('4000001', '4000002')
    GROUP BY YEAR(e.ddate), MONTH(e.ddate)
    ORDER BY YEAR(e.ddate), MONTH(e.ddate)
    `
  );

  const monthlyPackageNormalComparison = await query<PackageNormalMonthRow>(
    `
    WITH month_base AS (
      SELECT CONVERT(date, DATEADD(day, 1 - DAY(GETDATE()), GETDATE())) AS month_start
    )
    SELECT
      YEAR(e.ddate) AS year,
      MONTH(e.ddate) AS month,
      SUM(CASE WHEN LTRIM(RTRIM(e.citem)) = '4000001' THEN e.ntotal ELSE 0 END) AS packageSales,
      SUM(CASE WHEN LTRIM(RTRIM(e.citem)) <> '4000001' THEN e.ntotal ELSE 0 END) AS normalSales
    FROM Pos.tblSalesEntry e
    CROSS JOIN month_base mb
    WHERE e.ddate >= DATEADD(month, -11, mb.month_start)
      AND e.ddate < DATEADD(month, 1, mb.month_start)
      AND ISNULL(e.cancelled, 0) = 0
      AND ISNULL(e.void, 0) = 0
      AND e.citem IS NOT NULL
    GROUP BY YEAR(e.ddate), MONTH(e.ddate)
    ORDER BY YEAR(e.ddate), MONTH(e.ddate)
    `
  );

  const currentMonthTotal = monthSummary?.currentTotal ?? 0;
  const previousMonthTotal = monthSummary?.previousTotal ?? 0;
  const monthDelta = previousMonthTotal
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;

  const todaySignups = signupSummary?.todayCount ?? 0;
  const monthSignups = signupSummary?.monthCount ?? 0;
  const currentSignupMonthTotal =
    monthlySignups[monthlySignups.length - 1]?.total ?? 0;
  const previousSignupMonthTotal =
    monthlySignups[monthlySignups.length - 2]?.total ?? 0;
  const signupMonthDelta = previousSignupMonthTotal
    ? ((currentSignupMonthTotal - previousSignupMonthTotal) /
        previousSignupMonthTotal) *
      100
    : 0;

  const stats = [
    {
      label: "Today’s sales (S$)",
      value: currency.format(todaySummary?.total ?? 0),
      detail: `${todaySummary?.receipts ?? 0} receipts`,
    },
    {
      label: "Avg ticket (S$)",
      value: currency.format(todaySummary?.avgTicket ?? 0),
      detail: "Per receipt",
    },
    {
      label: "Member sales today (S$)",
      value: currency.format(walkInSummary?.memberSales ?? 0),
      detail: "Members only",
    },
    {
      label: "Walk-in sales today (S$)",
      value: currency.format(walkInSummary?.walkInSales ?? 0),
      detail: "Non-members",
    },
    {
      label: "This month (S$)",
      value: currency.format(currentMonthTotal),
      detail: `${monthDelta >= 0 ? "+" : ""}${monthDelta.toFixed(1)}% vs last month`,
    },
    {
      label: "Last month (S$)",
      value: currency.format(previousMonthTotal),
      detail: "Completed month",
    },
    {
      label: "Member signups today",
      value: `${todaySignups}`,
      detail: "New memberships",
    },
    {
      label: "Member signups (month)",
      value: `${monthSignups}`,
      detail: "Month to date",
    },
  ];

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {stats.map((item) => (
          <Card
            key={item.label}
            className="rounded-2xl border-[var(--color-line)] bg-[var(--color-card)]"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-[0.2em] text-black/40">
                {item.label}
              </CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {item.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-black/60">
              {item.detail}
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Top service by month (S$)</CardTitle>
            <CardDescription>
              Compare the best-selling service for the current and previous month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  This month
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {currentTopService?.cdesc || "No data"}
                </p>
                <p className="mt-1 text-sm text-black/60">
                  {currentTopService
                    ? currency.format(currentTopService.total)
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Last month
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {previousTopService?.cdesc || "No data"}
                </p>
                <p className="mt-1 text-sm text-black/60">
                  {previousTopService
                    ? currency.format(previousTopService.total)
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Top product by month (S$)</CardTitle>
            <CardDescription>
              Compare the best-selling retail product for the current and previous month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  This month
                </p>
                {currentTopProducts.length === 0 ? (
                  <p className="mt-3 text-sm text-black/60">No data</p>
                ) : (
                  <div className="mt-3 space-y-3 text-sm">
                    {currentTopProducts.map((product) => (
                      <div
                        key={`current-${product.cdesc}`}
                        className="flex items-center justify-between"
                      >
                        <span className="font-semibold">
                          {truncateFromEnd(
                            toTitleCase(product.cdesc),
                            maxLabelLength
                          )}
                        </span>
                        <span className="text-black/60">
                          {currency.format(product.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Last month
                </p>
                {previousTopProducts.length === 0 ? (
                  <p className="mt-3 text-sm text-black/60">No data</p>
                ) : (
                  <div className="mt-3 space-y-3 text-sm">
                    {previousTopProducts.map((product) => (
                      <div
                        key={`previous-${product.cdesc}`}
                        className="flex items-center justify-between"
                      >
                        <span className="font-semibold">
                          {truncateFromEnd(
                            toTitleCase(product.cdesc),
                            maxLabelLength
                          )}
                        </span>
                        <span className="text-black/60">
                          {currency.format(product.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              Best package sales by location (last 3 months)
            </CardTitle>
            <CardDescription>
              Top package revenue per location in the last 3 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topServiceByLocation.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No service data available.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Summary
                </div>
                <div className="text-2xl font-semibold">
                  Location performance
                </div>
                <p className="text-sm text-black/60">
                  Totals across the last 3 months.
                </p>
                <div className="mt-4 space-y-3 text-sm">
                {topServiceByLocation.map((row) => (
                  <div
                    key={`service-${row.locationCode}`}
                    className="flex items-center justify-between border-b border-[var(--color-line)] pb-2 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">
                        {row.locationName || row.locationCode}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                        {truncateFromEnd(
                          toTitleCase(row.itemName),
                          maxLabelLength
                        )}
                      </p>
                    </div>
                    <span className="text-black/60">
                      {currency.format(row.total)}
                    </span>
                  </div>
                ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              Best product sales by location (last 3 months)
            </CardTitle>
            <CardDescription>
              Top retail product revenue per location in the last 3 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topProductByLocation.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No product data available.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Summary
                </div>
                <div className="text-2xl font-semibold">
                  Location performance
                </div>
                <p className="text-sm text-black/60">
                  Totals across the last 3 months.
                </p>
                <div className="mt-4 space-y-3 text-sm">
                {topProductByLocation.map((row) => (
                  <div
                    key={`product-${row.locationCode}`}
                    className="flex items-center justify-between border-b border-[var(--color-line)] pb-2 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">
                        {row.locationName || row.locationCode}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                        {truncateFromEnd(
                          toTitleCase(row.itemName),
                          maxLabelLength
                        )}
                      </p>
                    </div>
                    <span className="text-black/60">
                      {currency.format(row.total)}
                    </span>
                  </div>
                ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-12">
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              Peak period by location (last 3 months)
            </CardTitle>
            <CardDescription>
              All weekdays ranked by sales per location in the last 3 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topDaysByLocation.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No peak day data available.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Summary
                </div>
                <div className="text-2xl font-semibold">
                  Location peak days
                </div>
                <p className="text-sm text-black/60">
                  Sorted by highest location weekday totals.
                </p>
                <div className="mt-4 space-y-4 text-sm">
                  {(() => {
                    const totalsByLocation = new Map<string, number>();
                    const labelsByLocation = new Map<string, string>();
                    topDaysByLocation.forEach((row) => {
                      totalsByLocation.set(
                        row.locationCode,
                        (totalsByLocation.get(row.locationCode) ?? 0) +
                          row.total
                      );
                      labelsByLocation.set(
                        row.locationCode,
                        row.locationName || row.locationCode
                      );
                    });
                    const orderedLocations = [...totalsByLocation.entries()].sort(
                      (a, b) => b[1] - a[1]
                    );
                    const locations = orderedLocations.map(([locationCode]) => ({
                      locationCode,
                      label: labelsByLocation.get(locationCode) || locationCode,
                    }));

                    return (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {locations.map((location) => {
                          const rows = topDaysByLocation.filter(
                            (row) => row.locationCode === location.locationCode
                          );
                          return (
                            <div
                              key={`peak-${location.locationCode}`}
                              className="rounded-2xl border border-[var(--color-line)] bg-white/60 px-4 py-3"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-semibold">{location.label}</p>
                                <span className="text-xs uppercase tracking-[0.2em] text-black/40">
                                  All days
                                </span>
                              </div>
                              <div className="mt-2 grid gap-2">
                                {rows.map((row) => (
                                  <div
                                    key={`${location.locationCode}-${row.rank}`}
                                    className="flex items-center justify-between"
                                  >
                                    <span className="text-black/70">
                                      #{row.rank} {row.weekdayName}
                                    </span>
                                    <span className="text-black/60">
                                      {currency.format(row.total)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Sales by month (S$)</CardTitle>
            <CardDescription>
              Rolling twelve-month comparison of total sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlySales.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No sales history available.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
                  {(() => {
                    const max = Math.max(
                      1,
                      ...monthlySales.map((row) => row.total)
                    );
                    const width = 600;
                    const height = 230;
                    const chartHeight = 180;
                    const padding = 28;
                    const points = monthlySales.map((row, index) => {
                      const x =
                        padding +
                        (index * (width - padding * 2)) /
                          Math.max(1, monthlySales.length - 1);
                      const y =
                        padding +
                        (1 - row.total / max) * (chartHeight - padding * 2);
                      return { x, y, ...row };
                    });
                    const linePath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.y}`
                      )
                      .join(" ");
                    const areaPath = `${linePath} L${
                      padding + (width - padding * 2)
                    } ${chartHeight - padding} L${padding} ${
                      chartHeight - padding
                    } Z`;
                    return (
                      <div className="space-y-4">
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="h-52 w-full"
                          role="img"
                          aria-label="Monthly sales line chart"
                        >
                          <defs>
                            <linearGradient
                              id="sales-area"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--color-gold)"
                                stopOpacity="0.55"
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--color-cream)"
                                stopOpacity="0.1"
                              />
                            </linearGradient>
                          </defs>
                          <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            rx="18"
                            fill="transparent"
                          />
                          {[0.25, 0.5, 0.75].map((ratio) => (
                            <line
                              key={ratio}
                              x1={padding}
                              x2={width - padding}
                              y1={padding + ratio * (chartHeight - padding * 2)}
                              y2={padding + ratio * (chartHeight - padding * 2)}
                              stroke="rgba(15, 12, 10, 0.08)"
                              strokeWidth="1"
                            />
                          ))}
                          <path d={areaPath} fill="url(#sales-area)" />
                          <path
                            d={linePath}
                            fill="none"
                            stroke="var(--color-night)"
                            strokeWidth="3"
                          />
                          {points.map((point) => (
                            <circle
                              key={`${point.year}-${point.month}`}
                              cx={point.x}
                              cy={point.y}
                              r="4"
                              fill="var(--color-rust)"
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))}
                          {monthlySales.map((row, index) => {
                            const date = new Date(row.year, row.month - 1, 1);
                            const label = new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              year: "2-digit",
                            }).format(date);
                            const x =
                              padding +
                              (index * (width - padding * 2)) /
                                Math.max(1, monthlySales.length - 1);
                            return (
                              <text
                                key={`${row.year}-${row.month}-label`}
                                x={x}
                                y={chartHeight + 24}
                                textAnchor="middle"
                                fontSize="11"
                                fill="rgba(15, 12, 10, 0.55)"
                              >
                                {label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white/60 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Momentum
                    </p>
                    <p className="text-2xl font-semibold">
                      {monthDelta >= 0 ? "Trending up" : "Trending down"}
                    </p>
                    <p className="text-sm text-black/60">
                      {monthDelta >= 0 ? "+" : ""}
                      {monthDelta.toFixed(1)}% vs last month.
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm">
                    {monthlySales.map((row) => {
                      const date = new Date(row.year, row.month - 1, 1);
                      const label = new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        year: "numeric",
                      }).format(date);
                      return (
                      <div
                        key={`${row.year}-${row.month}-summary`}
                        className="flex items-center justify-between"
                      >
                        <span className="text-black/70">{label}</span>
                        <span className="font-semibold">
                          {currency.format(row.total)}
                        </span>
                      </div>
                    );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Sales by location (S$)</CardTitle>
            <CardDescription>
              Monthly performance of the top locations in the last 12 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyLocationPerformance.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No location sales data available.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
                  {(() => {
                    const colors = [
                      "var(--color-night)",
                      "var(--color-gold)",
                      "var(--color-sage)",
                      "var(--color-rust)",
                      "rgba(15, 12, 10, 0.55)",
                    ];
                    const monthKeys = Array.from(
                      new Set(
                        monthlyLocationPerformance.map(
                          (row) => `${row.year}-${row.month}`
                        )
                      )
                    );
                    const locations = Array.from(
                      new Set(
                        monthlyLocationPerformance.map((row) => row.locationCode)
                      )
                    );
                    const totalsByLoc = new Map<string, number>();
                    monthlyLocationPerformance.forEach((row) => {
                      totalsByLoc.set(
                        row.locationCode,
                        (totalsByLoc.get(row.locationCode) ?? 0) + row.total
                      );
                    });
                    const orderedLocations = [...locations].sort((a, b) => {
                      return (totalsByLoc.get(b) ?? 0) - (totalsByLoc.get(a) ?? 0);
                    });
                    const labelsByLoc = new Map<string, string>();
                    monthlyLocationPerformance.forEach((row) => {
                      labelsByLoc.set(
                        row.locationCode,
                        row.locationName || row.locationCode
                      );
                    });
                    const max = Math.max(
                      1,
                      ...monthlyLocationPerformance.map((row) => row.total)
                    );
                    const width = 600;
                    const height = 230;
                    const chartHeight = 180;
                    const padding = 28;
                    const groupWidth =
                      (width - padding * 2) / Math.max(1, monthKeys.length);
                    const monthGap = 36;
                    const barWidth = Math.max(
                      8,
                      Math.min(22, (groupWidth * 0.6) / orderedLocations.length)
                    );
                    const gap = Math.max(2, barWidth * 0.25);
                    const groupOffset =
                      (groupWidth -
                        (barWidth + gap) * orderedLocations.length +
                        gap) /
                      2;
                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-black/40">
                          {orderedLocations.map((location, index) => (
                            <div key={location} className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              {labelsByLoc.get(location)}
                            </div>
                          ))}
                        </div>
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="h-52 w-full"
                          role="img"
                          aria-label="Monthly sales by location bar chart"
                        >
                          {[0.25, 0.5, 0.75].map((ratio) => (
                            <line
                              key={ratio}
                              x1={padding}
                              x2={width - padding}
                              y1={padding + ratio * (chartHeight - padding * 2)}
                              y2={padding + ratio * (chartHeight - padding * 2)}
                              stroke="rgba(15, 12, 10, 0.08)"
                              strokeWidth="1"
                            />
                          ))}
                          {monthKeys.map((key, monthIndex) => {
                            const [year, month] = key.split("-").map(Number);
                            return orderedLocations.map((location, locIndex) => {
                              const row = monthlyLocationPerformance.find(
                                (item) =>
                                  item.locationCode === location &&
                                  item.year === year &&
                                  item.month === month
                              );
                              const total = row?.total ?? 0;
                              const x =
                                padding +
                              monthIndex * (groupWidth + monthGap) +
                              groupOffset +
                              locIndex * (barWidth + gap);
                              const heightValue =
                                (total / max) * (chartHeight - padding * 2);
                              const y = chartHeight - padding - heightValue;
                              return (
                                <rect
                                  key={`${location}-${key}`}
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={Math.max(2, heightValue)}
                                  rx={4}
                                  fill={colors[locIndex % colors.length]}
                                />
                              );
                            });
                          })}
                          {monthKeys.map((key, index) => {
                            const [year, month] = key.split("-").map(Number);
                            const label = new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              year: "2-digit",
                            }).format(new Date(year, month - 1, 1));
                            const x =
                              padding +
                              index * (groupWidth + monthGap) +
                              groupWidth / 2;
                            return (
                              <text
                                key={`${key}-label`}
                                x={x}
                                y={chartHeight + 24}
                                textAnchor="middle"
                                fontSize="11"
                                fill="rgba(15, 12, 10, 0.55)"
                              >
                                {label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white/60 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Summary
                    </p>
                    <p className="text-2xl font-semibold">
                      Location performance
                    </p>
                    <p className="text-sm text-black/60">
                      Totals across the last 12 months.
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm">
                    {(() => {
                      const totals = new Map<string, number>();
                      const labels = new Map<string, string>();
                      const peaks = new Map<
                        string,
                        { weekdayName: string; total: number }
                      >();
                      monthlyLocationPerformance.forEach((row) => {
                        totals.set(
                          row.locationCode,
                          (totals.get(row.locationCode) ?? 0) + row.total
                        );
                        labels.set(
                          row.locationCode,
                          row.locationName || row.locationCode
                        );
                      });
                      peakDayByLocation.forEach((row) => {
                        peaks.set(row.locationCode, {
                          weekdayName: row.weekdayName,
                          total: row.total,
                        });
                      });
                      const ordered = [...totals.entries()].sort(
                        (a, b) => b[1] - a[1]
                      );
                      return ordered.map(([locationCode, total]) => (
                        <div
                          key={`${locationCode}-summary`}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <span className="text-black/70">
                              {labels.get(locationCode)}
                            </span>
                            <div className="text-xs uppercase tracking-[0.2em] text-black/40">
                              Peak day (last 3 months):{" "}
                              {peaks.get(locationCode)?.weekdayName || "—"}
                            </div>
                          </div>
                          <span className="text-right text-sm text-black/60">
                            {currency.format(total)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Member vs Walk-in Sales (S$)</CardTitle>
            <CardDescription>
              Monthly totals for member and walk-in sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyWalkInComparison.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No member or walk-in sales found.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
                  {(() => {
                    const max = Math.max(
                      1,
                      ...monthlyWalkInComparison.map((row) =>
                        Math.max(row.memberSales, row.walkInSales)
                      )
                    );
                    const width = 600;
                    const height = 230;
                    const chartHeight = 180;
                    const padding = 28;
                    const points = monthlyWalkInComparison.map((row, index) => {
                      const x =
                        padding +
                        (index * (width - padding * 2)) /
                          Math.max(1, monthlyWalkInComparison.length - 1);
                      const yMember =
                        padding +
                        (1 - row.memberSales / max) * (chartHeight - padding * 2);
                      const yWalkIn =
                        padding +
                        (1 - row.walkInSales / max) * (chartHeight - padding * 2);
                      return { x, yMember, yWalkIn, ...row };
                    });
                    const memberPath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.yMember}`
                      )
                      .join(" ");
                    const walkInPath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.yWalkIn}`
                      )
                      .join(" ");
                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-black/40">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-night)]" />
                            Member Sales
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-rust)]" />
                            Walk-in Sales
                          </div>
                        </div>
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="h-52 w-full"
                          role="img"
                          aria-label="Monthly member versus walk-in sales line chart"
                        >
                          {[0.25, 0.5, 0.75].map((ratio) => (
                            <line
                              key={ratio}
                              x1={padding}
                              x2={width - padding}
                              y1={padding + ratio * (chartHeight - padding * 2)}
                              y2={padding + ratio * (chartHeight - padding * 2)}
                              stroke="rgba(15, 12, 10, 0.08)"
                              strokeWidth="1"
                            />
                          ))}
                          <path
                            d={memberPath}
                            fill="none"
                            stroke="var(--color-night)"
                            strokeWidth="3"
                          />
                          <path
                            d={walkInPath}
                            fill="none"
                            stroke="var(--color-rust)"
                            strokeWidth="3"
                          />
                          {points.map((point) => (
                            <circle
                              key={`${point.year}-${point.month}-member`}
                              cx={point.x}
                              cy={point.yMember}
                              r="4"
                              fill="var(--color-night)"
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))}
                          {points.map((point) => (
                            <circle
                              key={`${point.year}-${point.month}-walkin`}
                              cx={point.x}
                              cy={point.yWalkIn}
                              r="4"
                              fill="var(--color-rust)"
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))}
                          {monthlyWalkInComparison.map((row, index) => {
                            const date = new Date(row.year, row.month - 1, 1);
                            const label = new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              year: "2-digit",
                            }).format(date);
                            const x =
                              padding +
                              (index * (width - padding * 2)) /
                                Math.max(1, monthlyWalkInComparison.length - 1);
                            return (
                              <text
                                key={`${row.year}-${row.month}-label`}
                                x={x}
                                y={chartHeight + 24}
                                textAnchor="middle"
                                fontSize="11"
                                fill="rgba(15, 12, 10, 0.55)"
                              >
                                {label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white/60 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Summary
                    </p>
                    <p className="text-2xl font-semibold">
                      Member vs Walk-in
                    </p>
                    <p className="text-sm text-black/60">
                      Monthly totals for member and walk-in sales.
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm">
                    {monthlyWalkInComparison.map((row) => {
                      const date = new Date(row.year, row.month - 1, 1);
                      const label = new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        year: "numeric",
                      }).format(date);
                      return (
                        <div
                          key={`${row.year}-${row.month}-summary`}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-4"
                        >
                          <span className="text-black/70">{label}</span>
                          <span className="text-right text-sm text-black/60">
                            Member {currency.format(row.memberSales)}
                          </span>
                          <span className="text-right text-sm text-black/60">
                            Walk-in {currency.format(row.walkInSales)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Package Sales vs Normal Sales (S$)</CardTitle>
            <CardDescription>
              Package sales (`4000001`) vs all other sales by count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyPackageNormalComparison.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No sales data available.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
                  {(() => {
                    const max = Math.max(
                      1,
                      ...monthlyPackageNormalComparison.map((row) =>
                        Math.max(row.packageSales, row.normalSales)
                      )
                    );
                    const width = 600;
                    const height = 230;
                    const chartHeight = 180;
                    const padding = 28;
                    const points = monthlyPackageNormalComparison.map((row, index) => {
                      const x =
                        padding +
                        (index * (width - padding * 2)) /
                          Math.max(1, monthlyPackageNormalComparison.length - 1);
                      const yPackage =
                        padding +
                        (1 - row.packageSales / max) * (chartHeight - padding * 2);
                      const yNormal =
                        padding +
                        (1 - row.normalSales / max) * (chartHeight - padding * 2);
                      return { x, yPackage, yNormal, ...row };
                    });
                    const packagePath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.yPackage}`
                      )
                      .join(" ");
                    const normalPath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.yNormal}`
                      )
                      .join(" ");
                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-black/40">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-night)]" />
                            Package Sales
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" />
                            Normal Sales
                          </div>
                        </div>
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="h-52 w-full"
                          role="img"
                          aria-label="Monthly package sales versus normal sales line chart"
                        >
                          {[0.25, 0.5, 0.75].map((ratio) => (
                            <line
                              key={ratio}
                              x1={padding}
                              x2={width - padding}
                              y1={padding + ratio * (chartHeight - padding * 2)}
                              y2={padding + ratio * (chartHeight - padding * 2)}
                              stroke="rgba(15, 12, 10, 0.08)"
                              strokeWidth="1"
                            />
                          ))}
                          <path
                            d={packagePath}
                            fill="none"
                            stroke="var(--color-night)"
                            strokeWidth="3"
                          />
                          <path
                            d={normalPath}
                            fill="none"
                            stroke="var(--color-gold)"
                            strokeWidth="3"
                          />
                          {points.map((point) => (
                            <circle
                              key={`${point.year}-${point.month}-package`}
                              cx={point.x}
                              cy={point.yPackage}
                              r="4"
                              fill="var(--color-night)"
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))}
                          {points.map((point) => (
                            <circle
                              key={`${point.year}-${point.month}-normal`}
                              cx={point.x}
                              cy={point.yNormal}
                              r="4"
                              fill="var(--color-gold)"
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))}
                          {monthlyPackageNormalComparison.map((row, index) => {
                            const date = new Date(row.year, row.month - 1, 1);
                            const label = new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              year: "2-digit",
                            }).format(date);
                            const x =
                              padding +
                              (index * (width - padding * 2)) /
                                Math.max(1, monthlyPackageNormalComparison.length - 1);
                            return (
                              <text
                                key={`${row.year}-${row.month}-label`}
                                x={x}
                                y={chartHeight + 24}
                                textAnchor="middle"
                                fontSize="11"
                                fill="rgba(15, 12, 10, 0.55)"
                              >
                                {label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white/60 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Summary
                    </p>
                    <p className="text-2xl font-semibold">
                      Package vs Normal
                    </p>
                    <p className="text-sm text-black/60">
                      Monthly totals of package sales and normal sales.
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm">
                    {monthlyPackageNormalComparison.map((row) => {
                      const date = new Date(row.year, row.month - 1, 1);
                      const label = new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        year: "numeric",
                      }).format(date);
                      return (
                        <div
                          key={`${row.year}-${row.month}-summary`}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-4"
                        >
                          <span className="text-black/70">{label}</span>
                          <span className="text-right text-sm text-black/60">
                            Package {currency.format(row.packageSales)}
                          </span>
                          <span className="text-right text-sm text-black/60">
                            Normal {currency.format(row.normalSales)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Package Sales vs Package Redeem Count</CardTitle>
            <CardDescription>
              Package sales (`4000001`) vs redeems (`4000002`) by count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyPackageComparison.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No package sales or redeems found.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
                  {(() => {
                    const max = Math.max(
                      1,
                      ...monthlyPackageComparison.map((row) =>
                        Math.max(row.sales, row.redeem)
                      )
                    );
                    const width = 600;
                    const height = 230;
                    const chartHeight = 180;
                    const padding = 28;
                    const points = monthlyPackageComparison.map((row, index) => {
                      const x =
                        padding +
                        (index * (width - padding * 2)) /
                          Math.max(1, monthlyPackageComparison.length - 1);
                      const ySales =
                        padding +
                        (1 - row.sales / max) * (chartHeight - padding * 2);
                      const yRedeem =
                        padding +
                        (1 - row.redeem / max) * (chartHeight - padding * 2);
                      return { x, ySales, yRedeem, ...row };
                    });
                    const salesPath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.ySales}`
                      )
                      .join(" ");
                    const redeemPath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.yRedeem}`
                      )
                      .join(" ");
                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-black/40">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-night)]" />
                            Sales
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-sage)]" />
                            Redeem
                          </div>
                        </div>
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="h-52 w-full"
                          role="img"
                          aria-label="Monthly sales versus redeem line chart"
                        >
                          {[0.25, 0.5, 0.75].map((ratio) => (
                            <line
                              key={ratio}
                              x1={padding}
                              x2={width - padding}
                              y1={padding + ratio * (chartHeight - padding * 2)}
                              y2={padding + ratio * (chartHeight - padding * 2)}
                              stroke="rgba(15, 12, 10, 0.08)"
                              strokeWidth="1"
                            />
                          ))}
                          <path
                            d={salesPath}
                            fill="none"
                            stroke="var(--color-night)"
                            strokeWidth="3"
                          />
                          <path
                            d={redeemPath}
                            fill="none"
                            stroke="var(--color-sage)"
                            strokeWidth="3"
                          />
                          {points.map((point) => (
                            <circle
                              key={`${point.year}-${point.month}-sales`}
                              cx={point.x}
                              cy={point.ySales}
                              r="4"
                              fill="var(--color-night)"
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))}
                          {points.map((point) => (
                            <circle
                              key={`${point.year}-${point.month}-redeem`}
                              cx={point.x}
                              cy={point.yRedeem}
                              r="4"
                              fill="var(--color-sage)"
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))}
                          {monthlyPackageComparison.map((row, index) => {
                            const date = new Date(row.year, row.month - 1, 1);
                            const label = new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              year: "2-digit",
                            }).format(date);
                            const x =
                              padding +
                              (index * (width - padding * 2)) /
                                Math.max(1, monthlyPackageComparison.length - 1);
                            return (
                              <text
                                key={`${row.year}-${row.month}-label`}
                                x={x}
                                y={chartHeight + 24}
                                textAnchor="middle"
                                fontSize="11"
                                fill="rgba(15, 12, 10, 0.55)"
                              >
                                {label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white/60 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Summary
                    </p>
                    <p className="text-2xl font-semibold">P.Sales vs P.Redeem</p>
                    <p className="text-sm text-black/60">
                      Monthly counts for packages sold and redeemed.
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm">
                    {monthlyPackageComparison.map((row) => {
                      const date = new Date(row.year, row.month - 1, 1);
                      const label = new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        year: "numeric",
                      }).format(date);
                      return (
                        <div
                          key={`${row.year}-${row.month}-summary`}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-4"
                        >
                          <span className="text-black/70">{label}</span>
                          <span className="text-right text-sm text-black/60">
                            Sales {new Intl.NumberFormat("en-US").format(row.sales)}
                          </span>
                          <span className="text-right text-sm text-black/60">
                            Redeem {new Intl.NumberFormat("en-US").format(row.redeem)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Member signup count by month</CardTitle>
            <CardDescription>
              Rolling twelve-month comparison of new members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlySignups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                No signup history available.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
                  {(() => {
                    const max = Math.max(
                      1,
                      ...monthlySignups.map((row) => row.total)
                    );
                  const width = 600;
                  const height = 230;
                  const chartHeight = 180;
                  const padding = 28;
                  const points = monthlySignups.map((row, index) => {
                    const x =
                      padding +
                      (index * (width - padding * 2)) /
                        Math.max(1, monthlySignups.length - 1);
                    const y =
                      padding +
                      (1 - row.total / max) * (chartHeight - padding * 2);
                    return { x, y, ...row };
                  });
                  const linePath = points
                      .map((point, index) =>
                        `${index === 0 ? "M" : "L"}${point.x} ${point.y}`
                      )
                      .join(" ");
                  const areaPath = `${linePath} L${
                    padding + (width - padding * 2)
                  } ${chartHeight - padding} L${padding} ${
                    chartHeight - padding
                  } Z`;
                  return (
                    <div className="space-y-4">
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                          className="h-52 w-full"
                          role="img"
                          aria-label="Monthly member signups line chart"
                        >
                          <defs>
                            <linearGradient
                              id="signup-area"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--color-sage)"
                                stopOpacity="0.55"
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--color-cream)"
                                stopOpacity="0.1"
                              />
                            </linearGradient>
                          </defs>
                          <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            rx="18"
                            fill="transparent"
                          />
                        {[0.25, 0.5, 0.75].map((ratio) => (
                          <line
                            key={ratio}
                            x1={padding}
                            x2={width - padding}
                            y1={padding + ratio * (chartHeight - padding * 2)}
                            y2={padding + ratio * (chartHeight - padding * 2)}
                            stroke="rgba(15, 12, 10, 0.08)"
                            strokeWidth="1"
                          />
                        ))}
                          <path d={areaPath} fill="url(#signup-area)" />
                          <path
                            d={linePath}
                            fill="none"
                            stroke="var(--color-sage)"
                            strokeWidth="3"
                          />
                        {points.map((point) => (
                          <circle
                            key={`${point.year}-${point.month}`}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="var(--color-night)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        ))}
                        {monthlySignups.map((row, index) => {
                          const date = new Date(row.year, row.month - 1, 1);
                          const label = new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            year: "2-digit",
                          }).format(date);
                          const x =
                            padding +
                            (index * (width - padding * 2)) /
                              Math.max(1, monthlySignups.length - 1);
                          return (
                            <text
                              key={`${row.year}-${row.month}-label`}
                              x={x}
                              y={chartHeight + 24}
                              textAnchor="middle"
                              fontSize="11"
                              fill="rgba(15, 12, 10, 0.55)"
                            >
                              {label}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}
              </div>
                <div className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-white/60 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Momentum
                    </p>
                    <p className="text-2xl font-semibold">
                      {signupMonthDelta >= 0 ? "Trending up" : "Trending down"}
                    </p>
                    <p className="text-sm text-black/60">
                      {signupMonthDelta >= 0 ? "+" : ""}
                      {signupMonthDelta.toFixed(1)}% vs last month.
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm">
                    {monthlySignups.map((row) => {
                      const date = new Date(row.year, row.month - 1, 1);
                      const label = new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        year: "numeric",
                      }).format(date);
                      return (
                        <div
                          key={`${row.year}-${row.month}-summary`}
                          className="flex items-center justify-between"
                        >
                          <span className="text-black/70">{label}</span>
                          <span className="font-semibold">{row.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
