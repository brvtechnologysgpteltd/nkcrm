import { NextResponse } from "next/server";

import { buildCampaignSql, type CampaignSpec, validateSpec } from "@/lib/campaignStore";
import { query } from "@/lib/db";

const SYSTEM_PROMPT = `You generate SQL Server (T-SQL) campaign queries for a salon CRM.
Return ONLY valid JSON with keys: useSalesMain (boolean), useSalesEntry (boolean), filters (string), orderBy (string or empty), sql (string or empty).
Rules:
- Base table is Membership.tblMembers aliased as m.
- You may reference Pos.tblSalesMain as sm and Pos.tblSalesEntry as se ONLY if needed.
- Join rules are fixed: sm.cmembercode = m.vchMember_Code, se.nidsalesmain = sm.id.
- If you provide "sql", it must be a single SELECT (or WITH + SELECT) in SQL Server syntax and must reference only these tables.
- If you do NOT provide "sql", then filters must be a SQL WHERE condition fragment (no WHERE keyword).
- Do NOT include semicolons or any statements other than SELECT.
- Only use these tables: Membership.tblMembers, Pos.tblSalesMain, Pos.tblSalesEntry.
- Use SQL Server syntax only. Do NOT use LIMIT, ILIKE, or date functions not in SQL Server.
- Member fields are exactly: vchMember_Code, vchMember_Name, vchMemberType_Code, dtMember_JoinedDate, dtMember_ExpiryDate, dtBirthDate, vchGender, vchTitle, vchOccupation, vchNRIC, vchCardNumber, vchAddress_1, vchAddress_2, vchAddress_3, vchCity, vchState, vchPostalCode, vchCountry, vchHomePhone, vchMobilePhone, vchEmail, textNotes, bitActive, dtModifiedDate, vchTransferFrom, vchTransferTo, vchHistory_SignupBy, dtHistory_LastSalesDate, mnyHistory_LastSalesAmount, mnyHistory_HighestSalesAmount, bitExport, ID, imgPicture, tstimestamp, dtRecordAdded, dtRecordModed, vchPin_No, vchFirstName, vchLastName, vchQuestionChoices, intBdayDiscYear, dtAnnivDate, vchQuestionChoices2, vchMarital, dtFirstUpgradeDate, bitNoPoint, vchLocation_Code, bitVerified, vchRace, vchCountryBirth, vchNationality, vchPassword, vchMemberRefer, vchByStaff, bitSignedTnC, vchOtherSetting, vchSysNotes.
- Output JSON only.
Example:
{"useSalesMain":true,"useSalesEntry":true,"filters":"se.ddate >= DATEADD(month,-3,GETDATE()) AND se.ntotal > 200","orderBy":"se.ddate DESC","sql":""}
Example (full sql):
{"useSalesMain":true,"useSalesEntry":true,"filters":"","orderBy":"","sql":"SELECT m.vchMember_Code, m.vchMember_Name, MAX(sm.ddate) AS last_sale_date FROM Membership.tblMembers m LEFT JOIN Pos.tblSalesMain sm ON sm.cmembercode = m.vchMember_Code WHERE sm.ddate >= DATEADD(month,-6,GETDATE()) GROUP BY m.vchMember_Code, m.vchMember_Name"}`;

function extractJson(text: string) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in response.");
  }
  return JSON.parse(text.slice(first, last + 1));
}

async function getOpenAiOutput(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OpenAI API error");
  }

  const data = await response.json();
  if (typeof data.output_text === "string") {
    return data.output_text;
  }
  const outputText = (data.output || [])
    .map((item: any) =>
      (item.content || [])
        .map((content: any) => content.text || content.output_text || "")
        .join(" ")
    )
    .join(" ")
    .trim();
  return outputText;
}

function buildComplexHint(prompt: string) {
  const lower = prompt.toLowerCase();
  const hints: string[] = [];

  if (lower.includes("latest sale") || lower.includes("last sale")) {
    hints.push(
      "The user asked for latest sale date. Use a full SQL query in `sql` with MAX(sm.ddate) AS last_sale_date and GROUP BY m.vchMember_Code, m.vchMember_Name."
    );
  }

  if (lower.includes("top spender") || lower.includes("top spenders")) {
    hints.push(
      "The user asked for top spenders. Use a full SQL query in `sql` with SUM(sm.ngtotal) AS total_spend and GROUP BY member fields. Order by total_spend DESC."
    );
  }

  if (lower.includes("visited at least once") || lower.includes("visited")) {
    hints.push(
      "If visit/transaction frequency is needed, use a full SQL query in `sql` with COUNT(sm.id) AS visit_count and HAVING COUNT(sm.id) >= 1."
    );
  }

  if (lower.includes("inactive") || lower.includes("no visit") || lower.includes("no visits")) {
    hints.push(
      "If inactivity is required, use a full SQL query in `sql` with MAX(sm.ddate) AS last_sale_date. If no threshold is specified, support 30/60/90/120 days using HAVING MAX(sm.ddate) < DATEADD(day,-X,GETDATE())."
    );
  }

  if (
    lower.includes("signed up 2025") ||
    lower.includes("signup 2025") ||
    lower.includes("joined 2025") ||
    lower.includes("joined in 2025") ||
    /\b2025\b/.test(lower)
  ) {
    hints.push(
      "If signup year 2025 is required, filter by m.dtMember_JoinedDate >= '2025-01-01' AND m.dtMember_JoinedDate < '2026-01-01'."
    );
  }

  if (lower.includes("birthday") || lower.includes("bday")) {
    hints.push(
      "If birthday month is needed, use m.dtBirthDate and filter MONTH(m.dtBirthDate) = MONTH(GETDATE())."
    );
  }

  if (lower.includes("first-time") || lower.includes("first time")) {
    hints.push(
      "If first-time buyers are needed, use COUNT(sm.id) = 1 with GROUP BY member fields."
    );
  }

  if (lower.includes("package holder") || lower.includes("package holders")) {
    hints.push(
      "If package holders are needed, use SalesEntry with se.citem = '4000001' to find members with package sales."
    );
  }

  if (hints.length === 0) {
    return "";
  }

  return `\n\nComplex query hint:\n- Use the full SQL in the 'sql' field.\n- Ensure SQL Server syntax.\n${hints
    .map((hint) => `- ${hint}`)
    .join("\n")}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = String(body.prompt || "").trim();
    const columns = Array.isArray(body.columns) ? body.columns : [];
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    let lastError = "";
    let lastSql = "";
    let lastSpec: CampaignSpec | null = null;
    const complexHint = buildComplexHint(prompt);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const retryHint = lastError
        ? `\n\nThe previous SQL failed with this error. Fix the filters/orderBy:\n${lastError}`
        : "";
      const output = await getOpenAiOutput(
      `${prompt}${retryHint}${complexHint}\n\nSelected columns: ${columns.join(", ")}`
    );
      const spec = extractJson(output) as CampaignSpec;
      lastSpec = spec;
      if (columns.length > 0) {
        spec.columns = columns;
      }
      validateSpec(spec);

      try {
        const sqlPreview = buildCampaignSql(spec, 100);
        lastSql = sqlPreview;
        const rows = await query<Record<string, unknown>>(sqlPreview);
        return NextResponse.json({ spec, sqlPreview, rows });
      } catch (error) {
        lastError = (error as Error).message || "Unknown SQL error.";
      }
    }

    return NextResponse.json(
      {
        error: lastError || "Failed to generate a valid SQL query.",
        sqlPreview: lastSql || "",
        spec: lastSpec,
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate SQL." },
      { status: 500 }
    );
  }
}
