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

const schedule = [
  { time: "9:30 AM", client: "Dina Park", service: "Blowout", stylist: "Jordan" },
  { time: "10:15 AM", client: "Alyssa Tran", service: "Highlights", stylist: "Jordan" },
  { time: "12:00 PM", client: "Zoe Brooks", service: "Deep treatment", stylist: "Carmen" },
  { time: "2:00 PM", client: "Maya Chen", service: "Gloss + trim", stylist: "Devon" },
];

export default function AppointmentsPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl">Appointments</h3>
          <p className="text-sm text-black/60">
            Plan the day with clarity and zero overlap.
          </p>
        </div>
        <Button className="rounded-full bg-[var(--color-night)] text-white hover:bg-[var(--color-night)]">
          Create appointment
        </Button>
      </div>

      <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Today&apos;s schedule</CardTitle>
          <CardDescription>
            Keep timing tight and spot overlaps instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Time</TableHead>
                <TableHead className="w-[30%]">Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Stylist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((item) => (
                <TableRow key={`${item.time}-${item.client}`}>
                  <TableCell className="text-muted-foreground">
                    {item.time}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {item.client}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.service}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
                    >
                      {item.stylist}
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
