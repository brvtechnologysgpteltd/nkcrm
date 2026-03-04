import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h3 className="text-2xl">Settings</h3>
        <p className="text-sm text-black/60">
          Salon configuration and preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Salon details</CardTitle>
            <CardDescription>
              Update how your brand and scheduling rules appear.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-2">
              <Label htmlFor="salon-name">Salon name</Label>
              <Input
                id="salon-name"
                defaultValue="NK Hairworks"
                className="rounded-xl border-[var(--color-line)] px-4 py-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time-zone">Time zone</Label>
              <Input
                id="time-zone"
                defaultValue="America/Los_Angeles"
                className="rounded-xl border-[var(--color-line)] px-4 py-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead-time">Booking lead time</Label>
              <Input
                id="lead-time"
                defaultValue="2 hours"
                className="rounded-xl border-[var(--color-line)] px-4 py-3"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>
              Control what messages go out to the team and clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] px-4 py-3">
              <div>
                <p className="font-semibold">Appointment reminders</p>
                <p className="text-black/50">Send SMS 24 hours before.</p>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
              >
                On
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] px-4 py-3">
              <div>
                <p className="font-semibold">Retail restock alerts</p>
                <p className="text-black/50">Notify when inventory is low.</p>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
              >
                On
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] px-4 py-3">
              <div>
                <p className="font-semibold">Daily summary</p>
                <p className="text-black/50">Email the closeout report.</p>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
              >
                Off
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
