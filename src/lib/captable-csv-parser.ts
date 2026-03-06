import Papa, { type ParseResult } from "papaparse";

export interface CaptableCSVRow {
  stakeholderEmail: string;
  shareClassName: string;
  certificateId: string;
  quantity: number;
  pricePerShare: number;
  issueDate: string;
  boardApprovalDate: string;
  vestingStartDate: string;
  rule144Date: string;
  cliffYears: number;
  vestingYears: number;
}

const HEADER_COMMENT =
  "Stakeholder Email,Share Class Name,Certificate ID,Quantity,Price Per Share,Issue Date (YYYY-MM-DD),Board Approval Date (YYYY-MM-DD),Vesting Start Date (YYYY-MM-DD),Rule 144 Date (YYYY-MM-DD),Cliff Years,Vesting Years";

const KEYS = [
  "stakeholderEmail",
  "shareClassName",
  "certificateId",
  "quantity",
  "pricePerShare",
  "issueDate",
  "boardApprovalDate",
  "vestingStartDate",
  "rule144Date",
  "cliffYears",
  "vestingYears",
] as const;

function isValidDate(val: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(val) && !Number.isNaN(Date.parse(val));
}

export const parseCaptableCSV = (csvFile: File): Promise<CaptableCSVRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      const parsed: ParseResult<string[]> = Papa.parse(csvData, {
        skipEmptyLines: true,
        comments: HEADER_COMMENT,
      });

      const rows: CaptableCSVRow[] = [];

      for (const [lineIdx, csv] of parsed.data.entries()) {
        const values = (csv as string[]).map((v) => v.trim());

        if (values.length !== KEYS.length) {
          reject(
            new Error(
              `Row ${lineIdx + 1}: expected ${KEYS.length} columns but got ${
                values.length
              }. Check the CSV template.`,
            ),
          );
          return;
        }

        const [
          stakeholderEmail,
          shareClassName,
          certificateId,
          quantityStr,
          priceStr,
          issueDate,
          boardApprovalDate,
          vestingStartDate,
          rule144Date,
          cliffStr,
          vestingStr,
        ] = values;

        if (!stakeholderEmail || !shareClassName || !certificateId) {
          reject(
            new Error(
              `Row ${
                lineIdx + 1
              }: email, share class and certificate ID are required.`,
            ),
          );
          return;
        }

        const quantity = Number(quantityStr);
        const pricePerShare = Number(priceStr);
        const cliffYears = Number(cliffStr ?? "0");
        const vestingYears = Number(vestingStr ?? "4");

        if (!Number.isInteger(quantity) || quantity <= 0) {
          reject(
            new Error(
              `Row ${lineIdx + 1}: quantity must be a positive integer.`,
            ),
          );
          return;
        }

        for (const [label, val] of [
          ["Issue Date", issueDate],
          ["Board Approval Date", boardApprovalDate],
          ["Vesting Start Date", vestingStartDate],
          ["Rule 144 Date", rule144Date],
        ] as [string, string | undefined][]) {
          if (val === undefined || val === "" || !isValidDate(val)) {
            reject(
              new Error(
                `Row ${lineIdx + 1}: "${label}" must be YYYY-MM-DD format.`,
              ),
            );
            return;
          }
        }

        const issue = issueDate as string;
        const boardApproval = boardApprovalDate as string;
        const vestingStart = vestingStartDate as string;
        const rule144 = rule144Date as string;

        rows.push({
          stakeholderEmail,
          shareClassName,
          certificateId,
          quantity,
          pricePerShare,
          issueDate: issue,
          boardApprovalDate: boardApproval,
          vestingStartDate: vestingStart,
          rule144Date: rule144,
          cliffYears,
          vestingYears,
        });
      }

      if (rows.length === 0) {
        reject(new Error("CSV file has no data rows."));
        return;
      }

      resolve(rows);
    };

    reader.onerror = () => reject(new Error("Error reading the file."));
    reader.readAsText(csvFile);
  });
};
