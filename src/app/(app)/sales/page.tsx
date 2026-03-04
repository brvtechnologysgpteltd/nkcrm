import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const metrics = [
  { label: "Service revenue", value: "$8,420" },
  { label: "Retail units", value: "64" },
  { label: "Avg ticket", value: "$142" },
];

const products = [
  { name: "Hydrating mask", units: 18, revenue: "$720" },
  { name: "Smoothing serum", units: 12, revenue: "$540" },
  { name: "Scalp renewal kit", units: 9, revenue: "$495" },
];

export default function SalesPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl">Sales</h3>
          <p className="text-sm text-black/60">
            Track service and retail performance.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full border-[var(--color-line)] px-4"
        >
          Export report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="rounded-2xl border-[var(--color-line)] bg-[var(--color-card)]"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-[0.2em] text-black/40">
                {metric.label}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">
                {metric.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Top retail products</CardTitle>
          <CardDescription>
            Best-selling items for the current reporting window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-semibold">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.units} units
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
                    >
                      {item.revenue}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
