import { NextResponse } from "next/server";

import { buildCampaignSql, type CampaignSpec, validateSpec } from "@/lib/campaignStore";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const spec = body.spec as CampaignSpec;
    if (!spec) {
      return NextResponse.json({ error: "Campaign spec is required." }, { status: 400 });
    }

    validateSpec(spec);
    const sql = buildCampaignSql(spec, 100);
    const rows = await query<Record<string, unknown>>(sql);

    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to run preview." },
      { status: 500 }
    );
  }
}
