import { NextResponse } from "next/server";

import { buildCampaignSql, type CampaignSpec, validateSpec } from "@/lib/campaignStore";
import { query } from "@/lib/db";

function formatDateValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }
  if (typeof value === "string") {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
  }
  return String(value);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text =
      value === null || value === undefined ? "" : formatDateValue(value);
    const needsEscape = /[",\n]/.test(text);
    const escaped = text.replace(/"/g, '""');
    return needsEscape ? `"${escaped}"` : escaped;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => escape(row[key])).join(","));
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const spec = body.spec as CampaignSpec;
    if (!spec) {
      return NextResponse.json({ error: "Campaign spec is required." }, { status: 400 });
    }

    validateSpec(spec);
    const sql = buildCampaignSql(spec, 20000);
    const rows = await query<Record<string, unknown>>(sql, [], {
      timeoutMs: 120000,
    });

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=campaign-results.csv",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to export CSV." },
      { status: 500 }
    );
  }
}
