import "server-only";
import { promises as fs } from "fs";
import path from "path";

export type CampaignSpec = {
  useSalesMain: boolean;
  useSalesEntry: boolean;
  filters: string;
  orderBy?: string;
  columns?: string[];
  sql?: string;
};

export type CampaignRecord = {
  id: string;
  name: string;
  prompt: string;
  spec: CampaignSpec;
  createdAt: string;
};

const storePath = path.join(process.cwd(), "data", "campaigns.json");

export async function loadCampaigns(): Promise<CampaignRecord[]> {
  try {
    const content = await fs.readFile(storePath, "utf-8");
    const data = JSON.parse(content) as CampaignRecord[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function saveCampaign(record: CampaignRecord) {
  const campaigns = await loadCampaigns();
  campaigns.unshift(record);
  await fs.writeFile(storePath, JSON.stringify(campaigns, null, 2));
}

import {
  campaignColumns,
  defaultCampaignColumns,
  getCampaignColumn,
} from "./campaignColumns";

const allowedTables = new Set([
  "membership.tblmembers",
  "pos.tblsalesmain",
  "pos.tblsalesentry",
]);

function normalizeTableName(input: string) {
  return input.replace(/[\[\]]/g, "").toLowerCase();
}

const disallowed = [
  /;+/,
  /--/,
  /\/\*/,
  /\*\//,
  /\b(insert|update|delete|merge|drop|alter|create|truncate|exec|execute)\b/i,
  /\blimit\b/i,
  /\boffset\b/i,
  /\bfetch\b/i,
  /\breturning\b/i,
  /\bilike\b/i,
  /\bregexp\b/i,
  /\bdate_trunc\b/i,
  /\bnow\(\)/i,
  /\bcurrent_timestamp\b/i,
  /\bcurrent_date\b/i,
  /\bextract\s*\(/i,
  /\binterval\b/i,
  /\bxp_/i,
];

function validateSql(sql: string) {
  const trimmed = sql.trim();
  if (!/^with\b/i.test(trimmed) && !/^select\b/i.test(trimmed)) {
    throw new Error("SQL must start with SELECT or WITH.");
  }
  if (disallowed.some((pattern) => pattern.test(trimmed))) {
    throw new Error("SQL contains disallowed keywords.");
  }

  const tableMatches = Array.from(
    trimmed.matchAll(/\b(from|join)\s+([a-zA-Z0-9_.\[\]]+)/gi)
  );
  for (const match of tableMatches) {
    const table = match[2];
    if (table.startsWith("(")) {
      continue;
    }
    const normalized = normalizeTableName(table);
    if (!allowedTables.has(normalized)) {
      throw new Error(`Table not allowed: ${table}`);
    }
  }
}

function applyTopLimit(sql: string, limit: number | null) {
  if (!limit) return sql;
  const hasTop = /\bselect\s+top\s*\(/i.test(sql);
  if (hasTop) return sql;

  const insertTop = (statement: string) =>
    statement.replace(/select\s+(distinct\s+)?/i, (match) => {
      return `${match}top (${limit}) `;
    });

  if (/^with\b/i.test(sql.trim())) {
    const index = sql.search(/\bselect\b/i);
    if (index === -1) return sql;
    const head = sql.slice(0, index);
    const tail = sql.slice(index);
    return `${head}${insertTop(tail)}`;
  }

  return insertTop(sql);
}

export function buildCampaignSql(spec: CampaignSpec, limit: number | null) {
  if (spec.sql?.trim()) {
    validateSql(spec.sql);
    return applyTopLimit(spec.sql, limit);
  }

  const columnIds =
    spec.columns && spec.columns.length > 0
      ? spec.columns
      : defaultCampaignColumns;
  const columnDefs = columnIds
    .map((id: string) => getCampaignColumn(id))
    .filter(Boolean);
  if (columnDefs.length === 0) {
    throw new Error("No valid columns selected.");
  }
  const limitClause = limit ? `TOP (${limit}) ` : "";
  const requiredSalesMain = columnDefs.some(
    (column: { requires?: string }) => column.requires === "sm"
  );
  const requiredSalesEntry = columnDefs.some(
    (column: { requires?: string }) => column.requires === "se"
  );
  const useSalesMain =
    spec.useSalesMain || spec.useSalesEntry || requiredSalesMain || requiredSalesEntry;
  const useSalesEntry = spec.useSalesEntry || requiredSalesEntry;
  const joins = [
    useSalesMain
      ? "LEFT JOIN Pos.tblSalesMain sm ON sm.cmembercode = m.vchMember_Code"
      : null,
    useSalesEntry
      ? "LEFT JOIN Pos.tblSalesEntry se ON se.nidsalesmain = sm.id"
      : null,
  ].filter(Boolean);

  const whereParts = ["m.bitActive = 1"];
  if (spec.filters?.trim()) {
    whereParts.push(`(${spec.filters})`);
  }

  const orderBy = spec.orderBy?.trim() ? `ORDER BY ${spec.orderBy}` : "";

  return `
SELECT ${limitClause}
  ${columnDefs.map((column: { select: string }) => column.select).join(",\n  ")}
FROM Membership.tblMembers m
${joins.join("\n")}
WHERE ${whereParts.join(" AND ")}
${orderBy}
  `.trim();
}

export function validateSpec(spec: CampaignSpec) {
  if (spec.sql?.trim()) {
    validateSql(spec.sql);
    return;
  }
  const allowed = new Set(campaignColumns.map((column) => column.id));
  const columnIds =
    spec.columns && spec.columns.length > 0
      ? spec.columns
      : defaultCampaignColumns;
  for (const id of columnIds) {
    if (!allowed.has(id)) {
      throw new Error(`Unsupported column: ${id}`);
    }
  }
  if (spec.useSalesEntry && !spec.useSalesMain) {
    throw new Error("SalesEntry requires SalesMain to be enabled.");
  }
  if (spec.filters && disallowed.some((pattern) => pattern.test(spec.filters))) {
    throw new Error("Filters contain disallowed SQL keywords.");
  }
  if (spec.orderBy && disallowed.some((pattern) => pattern.test(spec.orderBy))) {
    throw new Error("Order clause contains disallowed SQL keywords.");
  }
}
