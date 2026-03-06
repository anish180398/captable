import { db } from "@/server/db";
import colors from "colors";
colors.enable();

const seedShareClasses = async () => {
  const companies = await db.company.findMany({ select: { id: true } });
  console.log(`Seeding share classes for ${companies.length} companies`.blue);

  let total = 0;

  for (const company of companies) {
    const boardDate = new Date("2022-01-01");
    const stockholderDate = new Date("2022-01-15");

    await db.shareClass.createMany({
      data: [
        {
          idx: 1,
          name: "Common Shares",
          classType: "COMMON",
          prefix: "CS",
          initialSharesAuthorized: BigInt(10_000_000),
          boardApprovalDate: boardDate,
          stockholderApprovalDate: stockholderDate,
          votesPerShare: 1,
          parValue: 0.0001,
          pricePerShare: 1.0,
          seniority: 1,
          conversionRights: "CONVERTS_TO_FUTURE_ROUND",
          liquidationPreferenceMultiple: 1.0,
          participationCapMultiple: 0.0,
          companyId: company.id,
        },
        {
          idx: 2,
          name: "Series A Preferred",
          classType: "PREFERRED",
          prefix: "PS",
          initialSharesAuthorized: BigInt(5_000_000),
          boardApprovalDate: new Date("2023-06-01"),
          stockholderApprovalDate: new Date("2023-06-15"),
          votesPerShare: 1,
          parValue: 0.0001,
          pricePerShare: 2.5,
          seniority: 2,
          conversionRights: "CONVERTS_TO_FUTURE_ROUND",
          liquidationPreferenceMultiple: 1.0,
          participationCapMultiple: 1.0,
          companyId: company.id,
        },
      ],
      skipDuplicates: true,
    });

    total += 2;
  }

  console.log(`🎉 Seeded ${total} share classes`.green);
};

export default seedShareClasses;
