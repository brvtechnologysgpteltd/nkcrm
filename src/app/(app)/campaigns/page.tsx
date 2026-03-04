"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  campaignColumns,
  defaultCampaignColumns,
  getCampaignColumn,
} from "@/lib/campaignColumns";

type CampaignSpec = {
  useSalesMain: boolean;
  useSalesEntry: boolean;
  filters: string;
  orderBy?: string;
  columns?: string[];
};

type CustomerRow = {
  [key: string]: string | number | null;
};

function formatCellValue(value: string | number | null) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") {
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const [datePart] = value.split("T");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }
    return value;
  }
  return String(value);
}

export default function CampaignsPage() {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [spec, setSpec] = useState<CampaignSpec | null>(null);
  const [sqlPreview, setSqlPreview] = useState("");
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(
    defaultCampaignColumns[0]
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultCampaignColumns
  );

  const canRun = Boolean(spec);

  const previewCount = rows.length;

  const handleGenerateAndPreview = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/campaigns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, columns: selectedColumns }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.sqlPreview) {
          setSqlPreview(data.sqlPreview);
          setShowSql(true);
        }
        if (data.spec) {
          const nextSpec = { ...data.spec, columns: selectedColumns };
          setSpec(nextSpec);
        }
        throw new Error(data.error || "Failed to generate SQL");
      }
      const nextSpec = { ...data.spec, columns: selectedColumns };
      setSpec(nextSpec);
      setSqlPreview(data.sqlPreview || "");
      setRows(data.rows || []);
      setShowSql(false);
      setStatus("Preview loaded (max 100 records).");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!spec) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/campaigns/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          prompt,
          spec: { ...spec, columns: selectedColumns },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save campaign");
      }
      setStatus("Campaign saved.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!spec) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/campaigns/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: { ...spec, columns: selectedColumns } }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to export CSV");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "campaign-results.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatus("CSV downloaded.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    if (spec?.sql && rows.length > 0) {
      return Object.keys(rows[0]).map((key) => ({
        id: key,
        label: key.replace(/_/g, " "),
        key,
      }));
    }
    return selectedColumns
      .map((id) => getCampaignColumn(id))
      .filter(Boolean)
      .map((column) => ({
        id: column!.id,
        label: column!.label,
        key: column!.key,
      }));
  }, [selectedColumns, rows, spec?.sql]);

  return (
    <div className="grid gap-6">
      <div>
        <h3 className="text-2xl">Campaigns</h3>
        <p className="text-sm text-black/60">
          Define a customer segment in plain language, generate SQL, and export
          the results.
        </p>
      </div>

      <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Campaign builder</CardTitle>
          <CardDescription>
            Describe your target audience. We generate a safe SQL filter and
            return members by name, contact number, and address.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Birthday reactivation"
              className="rounded-xl border-[var(--color-line)] px-4 py-3"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="campaign-prompt">Campaign definition</Label>
            <textarea
              id="campaign-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              placeholder="Members who joined in the last 6 months and spent more than 200 in the last 90 days."
              className="min-h-[120px] rounded-xl border border-[var(--color-line)] bg-transparent px-4 py-3 text-sm focus:border-[var(--color-gold)] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleGenerateAndPreview}
              disabled={loading || !prompt.trim()}
              className="rounded-xl bg-[var(--color-night)] text-white hover:bg-[var(--color-night)]"
            >
              Generate & Preview
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={loading || !canRun || !name.trim()}
              className="rounded-xl border-[var(--color-line)]"
            >
              Save campaign
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={loading || !canRun}
              className="rounded-xl border-[var(--color-line)]"
            >
              Download CSV
            </Button>
            {sqlPreview ? (
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowSql((prev) => !prev)}
                className="rounded-xl border-[var(--color-line)]"
              >
                {showSql ? "Hide SQL Statement" : "Show SQL Statement"}
              </Button>
            ) : null}
          </div>
          {status ? <p className="text-sm text-black/60">{status}</p> : null}
          {sqlPreview && showSql ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/60 p-4 text-xs text-black/70">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                SQL statement (top 100)
              </p>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {sqlPreview}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Preview results</CardTitle>
          <CardDescription>
            Showing up to 100 records. Use CSV export to download the full list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="column-select">Add column</Label>
              <select
                id="column-select"
                value={selectedColumnId}
                onChange={(event) => setSelectedColumnId(event.target.value)}
                className="rounded-xl border border-[var(--color-line)] bg-transparent px-4 py-3 text-sm"
              >
                {campaignColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!selectedColumns.includes(selectedColumnId)) {
                  setSelectedColumns((prev) => [...prev, selectedColumnId]);
                }
              }}
              className="rounded-xl border-[var(--color-line)]"
            >
              Add column
            </Button>
          </div>
          {selectedColumns.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {selectedColumns.map((columnId) => {
                const column = getCampaignColumn(columnId);
                return (
                  <button
                    key={columnId}
                    type="button"
                    onClick={() =>
                      setSelectedColumns((prev) =>
                        prev.filter((item) => item !== columnId)
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/70 px-3 py-1 text-xs"
                  >
                    {column?.label || columnId}
                    <span className="text-black/40">×</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-10 text-center text-sm text-muted-foreground">
              No results yet.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-black/60">{previewCount} records</p>
              <Table>
                <TableHeader>
                  <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.id}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={`${row.member_code || row.member_name || "row"}-${index}`}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${column.id}-${index}`}
                        className="text-muted-foreground"
                      >
                        {formatCellValue(row[column.key] ?? null)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
