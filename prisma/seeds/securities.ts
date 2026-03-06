import { generatePublicId } from "@/common/id";
import { db } from "@/server/db";
import colors from "colors";
colors.enable();

// Maps stakeholder email role prefix → share allocation config
const SHARE_GRANTS = [
  {
    rolePrefix: "founder",
    qty: 2_000_000,
    price: 0.0001,
    shareType: "COMMON",
    certPrefix: "CS-F",
  },
  {
    rolePrefix: "cofounder",
    qty: 1_500_000,
    price: 0.0001,
    shareType: "COMMON",
    certPrefix: "CS-C",
  },
  {
    rolePrefix: "angel",
    qty: 500_000,
    price: 1.0,
    shareType: "COMMON",
    certPrefix: "CS-A",
  },
  {
    rolePrefix: "vc",
    qty: 1_000_000,
    price: 2.5,
    shareType: "PREFERRED",
    certPrefix: "PS-V",
  },
] as const;

const OPTION_GRANTS = [
  { rolePrefix: "eng", qty: 100_000, exercisePrice: 1.0, type: "ISO" },
  { rolePrefix: "senior_eng", qty: 200_000, exercisePrice: 1.0, type: "ISO" },
  { rolePrefix: "advisor", qty: 50_000, exercisePrice: 1.0, type: "NSO" },
  { rolePrefix: "consultant", qty: 25_000, exercisePrice: 1.5, type: "NSO" },
] as const;

const seedSecurities = async () => {
  const companies = await db.company.findMany({ select: { id: true } });
  console.log(
    `Seeding shares + options for ${companies.length} companies`.blue,
  );

  let shareCount = 0;
  let optionCount = 0;

  for (const [companyIdx, company] of companies.entries()) {
    const stakeholders = await db.stakeholder.findMany({
      where: { companyId: company.id },
      select: { id: true, email: true },
    });

    const commonClass = await db.shareClass.findFirst({
      where: { companyId: company.id, classType: "COMMON" },
      select: { id: true },
    });
    const preferredClass = await db.shareClass.findFirst({
      where: { companyId: company.id, classType: "PREFERRED" },
      select: { id: true },
    });
    const equityPlan = await db.equityPlan.findFirst({
      where: { companyId: company.id },
      select: { id: true },
    });

    if (!commonClass || !preferredClass || !equityPlan) continue;

    // ----- SHARES -----
    for (const grant of SHARE_GRANTS) {
      const stakeholder = stakeholders.find((s) =>
        s.email.startsWith(`${grant.rolePrefix}.co`),
      );
      if (!stakeholder) continue;

      const shareClassId =
        grant.shareType === "PREFERRED" ? preferredClass.id : commonClass.id;

      await db.share.create({
        data: {
          companyId: company.id,
          stakeholderId: stakeholder.id,
          shareClassId,
          certificateId: `${grant.certPrefix}-${companyIdx + 1}`,
          quantity: grant.qty,
          pricePerShare: grant.price,
          capitalContribution: grant.qty * grant.price,
          ipContribution: 0,
          debtCancelled: 0,
          otherContributions: 0,
          cliffYears:
            grant.rolePrefix === "founder" || grant.rolePrefix === "cofounder"
              ? 1
              : 0,
          vestingYears:
            grant.rolePrefix === "founder" || grant.rolePrefix === "cofounder"
              ? 4
              : 0,
          companyLegends: ["US_SECURITIES_ACT"],
          status: "ACTIVE",
          issueDate: new Date("2022-02-01"),
          boardApprovalDate: new Date("2022-01-15"),
          vestingStartDate: new Date("2022-02-01"),
          rule144Date: new Date("2023-02-01"),
        },
      });
      shareCount++;
    }

    // ----- OPTIONS -----
    for (const [grantIdx, grant] of OPTION_GRANTS.entries()) {
      const stakeholder = stakeholders.find((s) =>
        s.email.startsWith(`${grant.rolePrefix}.co`),
      );
      if (!stakeholder) continue;

      await db.option.create({
        data: {
          companyId: company.id,
          stakeholderId: stakeholder.id,
          equityPlanId: equityPlan.id,
          grantId: `OPT-${companyIdx + 1}-${grantIdx + 1}`,
          quantity: grant.qty,
          exercisePrice: grant.exercisePrice,
          type: grant.type,
          status: "ACTIVE",
          cliffYears: 1,
          vestingYears: 4,
          issueDate: new Date("2022-06-01"),
          expirationDate: new Date("2032-06-01"),
          vestingStartDate: new Date("2022-06-01"),
          boardApprovalDate: new Date("2022-05-15"),
          rule144Date: new Date("2023-06-01"),
        },
      });
      optionCount++;
    }
  }

  console.log(`🎉 Seeded ${shareCount} shares + ${optionCount} options`.green);
};

export default seedSecurities;
