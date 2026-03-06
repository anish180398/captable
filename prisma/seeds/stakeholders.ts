import { db } from "@/server/db";
import colors from "colors";
colors.enable();

// Each company gets these stakeholders (email is prefixed with companyIdx for uniqueness)
const STAKEHOLDER_TEMPLATES = [
  {
    name: "Alice Founder",
    role: "FOUNDER",
    type: "INDIVIDUAL",
    rel: "FOUNDER",
  },
  {
    name: "Bob Cofounder",
    role: "COFOUNDER",
    type: "INDIVIDUAL",
    rel: "FOUNDER",
  },
  { name: "Carol Angel", role: "ANGEL", type: "INDIVIDUAL", rel: "INVESTOR" },
  { name: "Sequoia Capital", role: "VC", type: "INSTITUTION", rel: "INVESTOR" },
  { name: "Dave Employee", role: "ENG", type: "INDIVIDUAL", rel: "EMPLOYEE" },
  {
    name: "Eve Senior Dev",
    role: "SENIOR_ENG",
    type: "INDIVIDUAL",
    rel: "EMPLOYEE",
  },
  {
    name: "Frank Advisor",
    role: "ADVISOR",
    type: "INDIVIDUAL",
    rel: "ADVISOR",
  },
  {
    name: "Grace Consultant",
    role: "CONSULTANT",
    type: "INDIVIDUAL",
    rel: "CONSULTANT",
  },
] as const;

const seedStakeholders = async () => {
  const companies = await db.company.findMany({
    select: { id: true, name: true },
  });
  console.log(`Seeding stakeholders for ${companies.length} companies`.blue);

  let total = 0;

  for (const [idx, company] of companies.entries()) {
    const data = STAKEHOLDER_TEMPLATES.map((t) => ({
      name: `${t.name} (${company.name})`,
      email: `${t.role.toLowerCase()}.co${idx + 1}@example.com`,
      stakeholderType: t.type,
      currentRelationship: t.rel,
      companyId: company.id,
      city: "San Francisco",
      state: "CA",
      country: "US",
    }));

    await db.stakeholder.createMany({ data, skipDuplicates: true });
    total += data.length;
  }

  console.log(`🎉 Seeded ${total} stakeholders`.green);
};

export default seedStakeholders;
