import { checkMembership } from "@/server/auth";
import { withAuth } from "@/trpc/api/trpc";

export const getCapTableProcedure = withAuth.query(
  async ({ ctx: { db, session } }) => {
    return db.$transaction(async (tx) => {
      const { companyId } = await checkMembership({ session, tx });

      const [shares, options] = await Promise.all([
        tx.share.findMany({
          where: { companyId },
          select: {
            id: true,
            certificateId: true,
            quantity: true,
            pricePerShare: true,
            status: true,
            issueDate: true,
            stakeholder: { select: { id: true, name: true, email: true } },
            shareClass: {
              select: { id: true, name: true, classType: true, prefix: true },
            },
          },
          orderBy: { issueDate: "desc" },
        }),

        tx.option.findMany({
          where: { companyId },
          select: {
            id: true,
            grantId: true,
            quantity: true,
            exercisePrice: true,
            type: true,
            status: true,
            issueDate: true,
            stakeholder: { select: { id: true, name: true, email: true } },
            equityPlan: { select: { id: true, name: true } },
          },
          orderBy: { issueDate: "desc" },
        }),
      ]);

      const totalSharesIssued = shares.reduce((sum, s) => sum + s.quantity, 0);
      const totalOptionsIssued = options.reduce(
        (sum, o) => sum + o.quantity,
        0,
      );
      const fullyDilutedTotal = totalSharesIssued + totalOptionsIssued;

      const shareRows = shares.map((s) => ({
        id: s.id,
        securityId: s.certificateId,
        securityType: "SHARE" as const,
        stakeholder: s.stakeholder,
        shareClass: s.shareClass,
        equityPlan: null,
        quantity: s.quantity,
        pricePerUnit: s.pricePerShare ?? 0,
        status: s.status,
        issueDate: s.issueDate,
        ownershipPct:
          fullyDilutedTotal > 0
            ? Number(((s.quantity / fullyDilutedTotal) * 100).toFixed(2))
            : 0,
      }));

      const optionRows = options.map((o) => ({
        id: o.id,
        securityId: o.grantId,
        securityType: "OPTION" as const,
        stakeholder: o.stakeholder,
        shareClass: null,
        equityPlan: o.equityPlan,
        quantity: o.quantity,
        pricePerUnit: o.exercisePrice,
        status: o.status,
        issueDate: o.issueDate,
        ownershipPct:
          fullyDilutedTotal > 0
            ? Number(((o.quantity / fullyDilutedTotal) * 100).toFixed(2))
            : 0,
      }));

      const rows = [...shareRows, ...optionRows].sort(
        (a, b) => b.issueDate.getTime() - a.issueDate.getTime(),
      );

      return {
        rows,
        summary: {
          totalSharesIssued,
          totalOptionsIssued,
          fullyDilutedTotal,
          totalStakeholders: new Set(
            [...shares, ...options].map((r) => r.stakeholder.id),
          ).size,
        },
      };
    });
  },
);
