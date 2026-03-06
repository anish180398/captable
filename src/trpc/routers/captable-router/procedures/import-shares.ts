import { generatePublicId } from "@/common/id";
import { Audit } from "@/server/audit";
import { checkMembership } from "@/server/auth";
import { withAuth } from "@/trpc/api/trpc";
import { z } from "zod";

const ImportShareRowSchema = z.object({
  stakeholderEmail: z.string().email(),
  shareClassName: z.string().min(1),
  certificateId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  pricePerShare: z.coerce.number().min(0),
  issueDate: z.string().date(),
  boardApprovalDate: z.string().date(),
  vestingStartDate: z.string().date(),
  rule144Date: z.string().date(),
  cliffYears: z.coerce.number().min(0).default(0),
  vestingYears: z.coerce.number().min(0).default(4),
});

export const ZodImportSharesSchema = z.object({
  shares: z.array(ImportShareRowSchema).min(1),
});

export type ImportShareRowType = z.infer<typeof ImportShareRowSchema>;

export const importSharesProcedure = withAuth
  .input(ZodImportSharesSchema)
  .mutation(async ({ ctx, input }) => {
    const { session, db, userAgent, requestIp } = ctx;

    try {
      const results = await db.$transaction(async (tx) => {
        const { companyId } = await checkMembership({ session, tx });

        const created: string[] = [];
        const skipped: string[] = [];

        for (const row of input.shares) {
          const stakeholder = await tx.stakeholder.findFirst({
            where: { email: row.stakeholderEmail, companyId },
            select: { id: true, name: true },
          });

          if (!stakeholder) {
            skipped.push(
              `${row.certificateId}: stakeholder ${row.stakeholderEmail} not found`,
            );
            continue;
          }

          const shareClass = await tx.shareClass.findFirst({
            where: { name: row.shareClassName, companyId },
            select: { id: true },
          });

          if (!shareClass) {
            skipped.push(
              `${row.certificateId}: share class "${row.shareClassName}" not found`,
            );
            continue;
          }

          const existing = await tx.share.findFirst({
            where: { certificateId: row.certificateId, companyId },
          });

          if (existing) {
            skipped.push(`${row.certificateId}: certificate ID already exists`);
            continue;
          }

          const share = await tx.share.create({
            data: {
              companyId,
              stakeholderId: stakeholder.id,
              shareClassId: shareClass.id,
              certificateId: row.certificateId,
              quantity: row.quantity,
              pricePerShare: row.pricePerShare,
              capitalContribution: 0,
              ipContribution: 0,
              debtCancelled: 0,
              otherContributions: 0,
              cliffYears: row.cliffYears,
              vestingYears: row.vestingYears,
              companyLegends: [],
              status: "ACTIVE",
              issueDate: new Date(row.issueDate),
              boardApprovalDate: new Date(row.boardApprovalDate),
              vestingStartDate: new Date(row.vestingStartDate),
              rule144Date: new Date(row.rule144Date),
            },
            select: { id: true },
          });

          await Audit.create(
            {
              action: "share.created",
              companyId,
              actor: { type: "user", id: session.user.id },
              context: { userAgent, requestIp },
              target: [{ type: "share", id: share.id }],
              summary: `${session.user.name} imported share ${row.certificateId} for ${stakeholder.name}`,
            },
            tx,
          );

          created.push(row.certificateId);
        }

        return { created, skipped };
      });

      return {
        success: true,
        message: `Imported ${results.created.length} share(s). ${
          results.skipped.length > 0
            ? `Skipped ${results.skipped.length}: ${results.skipped.join("; ")}`
            : ""
        }`,
        ...results,
      };
    } catch (error) {
      console.error("Cap table import error:", error);
      return {
        success: false,
        message: "Import failed. Please check the CSV and try again.",
        created: [],
        skipped: [],
      };
    }
  });
