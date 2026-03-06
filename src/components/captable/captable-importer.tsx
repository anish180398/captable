"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseCaptableCSV } from "@/lib/captable-csv-parser";
import { api } from "@/trpc/react";
import { RiUploadCloudLine, RiUploadLine } from "@remixicon/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function CapTableImporter() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { mutateAsync } = api.capTable.importShares.useMutation();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.currentTarget.files?.[0];
    if (f) setFile(f);
  };

  const onImport = async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      const rows = await parseCaptableCSV(file);
      const result = await mutateAsync({ shares: rows });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setFile(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(
        (err as Error).message ?? "Import failed. Please check the CSV file.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RiUploadCloudLine className="mr-2 h-4 w-4" />
          Import cap table
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import cap table from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import shares. Stakeholders and share
            classes must already exist in the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground leading-6">
            Please download the{" "}
            <Link
              download
              href="/sample/csv/captable-shares-template.csv"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-300"
            >
              sample CSV template <span aria-hidden="true">&darr;</span>
            </Link>
            , fill in your data, and upload it here.
          </div>

          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <> */}
          <div
            className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <RiUploadLine className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Click to select a .csv file"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={onFileChange}
              hidden
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Expected columns:{" "}
            <span className="font-mono">
              Stakeholder Email, Share Class Name, Certificate ID, Quantity,
              Price Per Share, Issue Date, Board Approval Date, Vesting Start
              Date, Rule 144 Date, Cliff Years, Vesting Years
            </span>
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={onImport} disabled={!file || isLoading}>
              {isLoading ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
