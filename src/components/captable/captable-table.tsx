"use client";

import { dayjsExt } from "@/common/dayjs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableBody } from "@/components/ui/data-table/data-table-body";
import { SortButton } from "@/components/ui/data-table/data-table-buttons";
import { DataTableContent } from "@/components/ui/data-table/data-table-content";
import { DataTableHeader } from "@/components/ui/data-table/data-table-header";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { formatNumber } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/shared";
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

type CapTableRow = RouterOutputs["capTable"]["getCapTable"]["rows"][number];

const securityTypeBadgeColor = (type: string) => {
  switch (type) {
    case "SHARE":
      return "bg-teal-50 text-teal-700 ring-teal-600/20";
    case "OPTION":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-600/20";
  }
};

const statusBadgeColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-50 text-green-700 ring-green-600/20";
    case "DRAFT":
      return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
    case "SIGNED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-600/20";
  }
};

export const columns: ColumnDef<CapTableRow>[] = [
  {
    id: "stakeholder",
    accessorKey: "stakeholder.name",
    header: ({ column }) => (
      <SortButton
        label="Stakeholder"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.stakeholder.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.stakeholder.email}
        </p>
      </div>
    ),
  },
  {
    id: "securityType",
    accessorKey: "securityType",
    header: ({ column }) => (
      <SortButton
        label="Type"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${securityTypeBadgeColor(
          row.original.securityType,
        )}`}
      >
        {row.original.securityType === "SHARE" ? "Share" : "Option"}
      </span>
    ),
  },
  {
    id: "securityId",
    accessorKey: "securityId",
    header: "Certificate / Grant ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.securityId}</span>
    ),
  },
  {
    id: "shareClass",
    header: "Share Class / Plan",
    cell: ({ row }) => {
      const { shareClass, equityPlan } = row.original;
      if (shareClass) return <span className="text-sm">{shareClass.name}</span>;
      if (equityPlan) return <span className="text-sm">{equityPlan.name}</span>;
      return <span className="text-muted-foreground text-sm">—</span>;
    },
  },
  {
    id: "quantity",
    accessorKey: "quantity",
    header: ({ column }) => (
      <SortButton
        label="Quantity"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">
        {formatNumber(row.original.quantity)}
      </span>
    ),
  },
  {
    id: "ownershipPct",
    accessorKey: "ownershipPct",
    header: ({ column }) => (
      <SortButton
        label="Ownership %"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">{row.original.ownershipPct}%</span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeColor(
          row.original.status,
        )}`}
      >
        {row.original.status.charAt(0) +
          row.original.status.slice(1).toLowerCase()}
      </span>
    ),
  },
  {
    id: "issueDate",
    accessorKey: "issueDate",
    header: ({ column }) => (
      <SortButton
        label="Issue Date"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {dayjsExt(row.original.issueDate).format("MMM D, YYYY")}
      </span>
    ),
  },
];

type CapTableTableProps = {
  rows: CapTableRow[];
};

export function CapTableTable({ rows }: CapTableTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DataTable table={table}>
      <DataTableContent>
        <DataTableHeader />
        <DataTableBody />
      </DataTableContent>
      <DataTablePagination />
    </DataTable>
  );
}
