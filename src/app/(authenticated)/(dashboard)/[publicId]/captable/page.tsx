import { CapTableImporter } from "@/components/captable/captable-importer";
import { CapTableTable } from "@/components/captable/captable-table";
import EmptyState from "@/components/common/empty-state";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/server";
import { RiPieChartFill } from "@remixicon/react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cap table",
};

const CaptablePage = async () => {
  const { rows, summary } = await api.capTable.getCapTable.query();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<RiPieChartFill />}
        title="Your cap table is empty"
        subtitle="Import an existing cap table from a CSV file, or issue shares and options via the Securities section."
      >
        <CapTableImporter />
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">Cap table</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All issued shares and options for your company
          </p>
        </div>
        <CapTableImporter />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Shares Issued",
            value: summary.totalSharesIssued.toLocaleString(),
          },
          {
            label: "Total Options Issued",
            value: summary.totalOptionsIssued.toLocaleString(),
          },
          {
            label: "Fully Diluted Total",
            value: summary.fullyDilutedTotal.toLocaleString(),
          },
          {
            label: "Total Stakeholders",
            value: summary.totalStakeholders.toString(),
          },
        ].map(({ label, value }) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>

      {/* Cap table */}
      <Card className="mx-auto mt-2 w-full">
        <CapTableTable rows={rows} />
      </Card>
    </div>
  );
};

export default CaptablePage;
