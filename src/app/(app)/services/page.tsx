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

const services = [
  { name: "Signature haircut", duration: "60 min", price: "$85" },
  { name: "Balayage + gloss", duration: "180 min", price: "$240" },
  { name: "Silk press", duration: "90 min", price: "$120" },
  { name: "Deep conditioning", duration: "45 min", price: "$65" },
];

export default function ServicesPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl">Services</h3>
          <p className="text-sm text-black/60">Curate the menu and pricing.</p>
        </div>
        <Button className="rounded-full bg-[var(--color-night)] text-white hover:bg-[var(--color-night)]">
          Add service
        </Button>
      </div>

      <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Service menu</CardTitle>
          <CardDescription>
            Keep your offerings aligned with current demand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.name}>
                  <TableCell className="font-semibold">
                    {service.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {service.duration}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
                    >
                      {service.price}
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
