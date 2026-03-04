import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/logout-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Customers", href: "/customers" },
  { label: "Appointments", href: "/appointments" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Staff", href: "/staff" },
  { label: "Services", href: "/services" },
  { label: "Sales", href: "/sales" },
  { label: "Settings", href: "/settings" },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navLinks = (
    <nav className="flex flex-col gap-2 text-sm">
      {navItems.map((item) => (
        <Link
          key={item.href}
          className="rounded-xl px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          href={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden bg-[var(--color-night)] p-6 text-white lg:flex lg:flex-col lg:gap-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">NK Hairworks</p>
          <h1 className="text-2xl">CRM</h1>
        </div>
        {navLinks}
        <div className="mt-2">
          <LogoutButton />
        </div>
        <div className="mt-auto rounded-2xl border border-white/10 p-4 text-sm">
          <p className="text-white/70">Next check-in</p>
          <p className="font-semibold">3:30 PM · Sam Rivera</p>
          <p className="text-white/60">Color refresh + trim</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-cream)] px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[var(--color-night)] text-white">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-white">NK Hairworks CRM</SheetTitle>
                </SheetHeader>
                {navLinks}
                <div className="mt-4">
                  <LogoutButton />
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 p-4 text-sm">
                  <p className="text-white/70">Next check-in</p>
                  <p className="font-semibold">3:30 PM · Sam Rivera</p>
                  <p className="text-white/60">Color refresh + trim</p>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.25em] text-black/40">
                Salon Overview
              </p>
              <h2 className="text-2xl">Welcome back, Admin</h2>
            </div>
          </div>
          <div />
        </header>
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
