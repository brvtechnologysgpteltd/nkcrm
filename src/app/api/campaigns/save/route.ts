import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { saveCampaign, type CampaignRecord, type CampaignSpec, validateSpec } from "@/lib/campaignStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const prompt = String(body.prompt || "").trim();
    const spec = body.spec as CampaignSpec;

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required." }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ error: "Campaign prompt is required." }, { status: 400 });
    }
    if (!spec) {
      return NextResponse.json({ error: "Campaign spec is required." }, { status: 400 });
    }

    validateSpec(spec);

    const record: CampaignRecord = {
      id: randomUUID(),
      name,
      prompt,
      spec,
      createdAt: new Date().toISOString(),
    };

    await saveCampaign(record);

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to save campaign." },
      { status: 500 }
    );
  }
}
