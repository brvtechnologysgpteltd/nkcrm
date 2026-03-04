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

const staff = [
  { name: "Jordan Miles", role: "Senior Colorist", status: "On shift" },
  { name: "Carmen Holt", role: "Stylist", status: "With client" },
  { name: "Devon Cole", role: "Cut specialist", status: "Break" },
  { name: "Sam Rivera", role: "Front desk", status: "Check-ins" },
];

export default function StaffPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl">Staff</h3>
          <p className="text-sm text-black/60">
            Roster, roles, and availability at a glance.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full border-[var(--color-line)] px-4"
        >
          Add team member
        </Button>
      </div>

      <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Team availability</CardTitle>
          <CardDescription>
            Live snapshot of who is on the floor right now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Team member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.name}>
                  <TableCell className="font-semibold">
                    {member.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.role}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
                    >
                      {member.status}
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
