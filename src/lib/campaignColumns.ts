export type CampaignColumn = {
  id: string;
  label: string;
  select: string;
  key: string;
  requires?: "sm" | "se";
};

export const campaignColumns: CampaignColumn[] = [
  {
    id: "member_name",
    label: "Member Name",
    select: "m.vchMember_Name AS member_name",
    key: "member_name",
  },
  {
    id: "first_name",
    label: "First Name",
    select: "m.vchFirstName AS first_name",
    key: "first_name",
  },
  {
    id: "last_name",
    label: "Last Name",
    select: "m.vchLastName AS last_name",
    key: "last_name",
  },
  {
    id: "member_code",
    label: "Member Code",
    select: "m.vchMember_Code AS member_code",
    key: "member_code",
  },
  {
    id: "member_type",
    label: "Member Type",
    select: "m.vchMemberType_Code AS member_type",
    key: "member_type",
  },
  {
    id: "mobile_phone",
    label: "Mobile Phone",
    select: "m.vchMobilePhone AS mobile_phone",
    key: "mobile_phone",
  },
  {
    id: "home_phone",
    label: "Home Phone",
    select: "m.vchHomePhone AS home_phone",
    key: "home_phone",
  },
  {
    id: "email",
    label: "Email",
    select: "m.vchEmail AS email",
    key: "email",
  },
  {
    id: "joined_date",
    label: "Joined Date",
    select: "m.dtMember_JoinedDate AS joined_date",
    key: "joined_date",
  },
  {
    id: "expiry_date",
    label: "Expiry Date",
    select: "m.dtMember_ExpiryDate AS expiry_date",
    key: "expiry_date",
  },
  {
    id: "birth_date",
    label: "Birth Date",
    select: "m.dtBirthDate AS birth_date",
    key: "birth_date",
  },
  {
    id: "gender",
    label: "Gender",
    select: "m.vchGender AS gender",
    key: "gender",
  },
  {
    id: "location_code",
    label: "Member Location Code",
    select: "m.vchLocation_Code AS location_code",
    key: "location_code",
  },
  {
    id: "last_sales_date",
    label: "Last Sales Date (Member)",
    select: "m.dtHistory_LastSalesDate AS last_sales_date",
    key: "last_sales_date",
  },
  {
    id: "last_sales_amount",
    label: "Last Sales Amount (Member)",
    select: "m.mnyHistory_LastSalesAmount AS last_sales_amount",
    key: "last_sales_amount",
  },
  {
    id: "highest_sales_amount",
    label: "Highest Sales Amount (Member)",
    select: "m.mnyHistory_HighestSalesAmount AS highest_sales_amount",
    key: "highest_sales_amount",
  },
  {
    id: "sale_date",
    label: "Sale Date",
    select: "sm.ddate AS sale_date",
    key: "sale_date",
    requires: "sm",
  },
  {
    id: "receipt",
    label: "Receipt",
    select: "sm.creceipt AS receipt",
    key: "receipt",
    requires: "sm",
  },
  {
    id: "sale_total",
    label: "Sale Total",
    select: "sm.ngtotal AS sale_total",
    key: "sale_total",
    requires: "sm",
  },
  {
    id: "entry_date",
    label: "Entry Date",
    select: "se.ddate AS entry_date",
    key: "entry_date",
    requires: "se",
  },
  {
    id: "item_code",
    label: "Item Code",
    select: "se.citem AS item_code",
    key: "item_code",
    requires: "se",
  },
  {
    id: "item_desc",
    label: "Item Description",
    select: "se.cdesc AS item_desc",
    key: "item_desc",
    requires: "se",
  },
  {
    id: "item_total",
    label: "Item Total",
    select: "se.ntotal AS item_total",
    key: "item_total",
    requires: "se",
  },
];

export const defaultCampaignColumns = [
  "member_name",
  "mobile_phone",
  "member_code",
  "email",
];

export function getCampaignColumn(id: string) {
  return campaignColumns.find((column) => column.id === id);
}
