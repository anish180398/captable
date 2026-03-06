import { db } from "@/server/db";
import colors from "colors";
colors.enable();

const seedEquityPlans = async () => {
  const companies = await db.company.findMany({ select: { id: true } });
  console.log(`Seeding equity plans for ${companies.length} companies`.blue);

  let total = 0;

  for (const company of companies) {
    const commonClass = await db.shareClass.findFirst({
      where: { companyId: company.id, classType: "COMMON" },
      select: { id: true },
    });

    if (!commonClass) continue;

    await db.equityPlan.create({
      data: {
        name: "2022 Stock Option Plan",
        boardApprovalDate: new Date("2022-01-01"),
        planEffectiveDate: new Date("2022-01-15"),
        initialSharesReserved: BigInt(2_000_000),
        defaultCancellatonBehavior: "RETIRE",
        comments: "Standard employee equity incentive plan",
        companyId: company.id,
        shareClassId: commonClass.id,
      },
    });

    total++;
  }

  console.log(`🎉 Seeded ${total} equity plans`.green);
};

export default seedEquityPlans;
