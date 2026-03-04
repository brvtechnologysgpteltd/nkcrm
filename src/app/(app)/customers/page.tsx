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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { query, sql } from "@/lib/db";

export const runtime = "nodejs";

type MemberRow = {
  vchMember_Code: string;
  vchMember_Name: string;
  vchEmail: string | null;
  vchMobilePhone: string;
  dtMember_JoinedDate: Date | null;
  dtMember_ExpiryDate: Date | null;
};

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(value);
}

type CustomersPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams?.q?.trim() ?? "";

  const customers = await query<MemberRow>(
    `
    SELECT TOP (50)
      vchMember_Code,
      vchMember_Name,
      vchEmail,
      vchMobilePhone,
      dtMember_JoinedDate,
      dtMember_ExpiryDate
    FROM Membership.tblMembers
    WHERE bitActive = 1
      AND (
        @search = ''
        OR vchMember_Name LIKE @searchLike
        OR vchMobilePhone LIKE @searchLike
        OR vchAddress_1 LIKE @searchLike
        OR vchAddress_2 LIKE @searchLike
        OR vchAddress_3 LIKE @searchLike
        OR vchCity LIKE @searchLike
        OR vchState LIKE @searchLike
        OR vchPostalCode LIKE @searchLike
      )
    ORDER BY dtRecordAdded DESC
    `,
    [
      { name: "search", type: sql.VarChar, value: searchQuery },
      { name: "searchLike", type: sql.VarChar, value: `%${searchQuery}%` },
    ]
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl">Customers</h3>
          <p className="text-sm text-black/60">
            Track loyalty, preferences, and rebooking.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-[var(--color-line)] bg-[var(--color-card)] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Customer roster</CardTitle>
          <CardDescription>
            Search by name, phone, or address fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 pb-6" role="search">
            <Label htmlFor="customer-search" className="text-sm">
              Search
            </Label>
            <Input
              id="customer-search"
              name="q"
              placeholder="Search name, phone, or address"
              defaultValue={searchQuery}
              className="rounded-xl border-[var(--color-line)] px-4 py-3"
            />
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Customer</TableHead>
                <TableHead>Member code</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.vchMember_Code}>
                    <TableCell>
                      <div className="font-semibold">
                        {customer.vchMember_Name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customer.vchEmail || "No email on file"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.vchMember_Code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(customer.dtMember_JoinedDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(customer.dtMember_ExpiryDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
                      >
                        {customer.vchMobilePhone || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
