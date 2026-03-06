import type { MemberStatusEnum } from "@/prisma/enums";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";
import colors from "colors";
colors.enable();

const TEAM = [
  {
    name: "Alex CEO",
    email: "ceo@example.com",
    title: "Co-Founder & CEO",
    status: "ACTIVE",
    isOnboarded: true,
  },
  {
    name: "Blake CTO",
    email: "cto@example.com",
    title: "Co-Founder & CTO",
    status: "ACTIVE",
    isOnboarded: true,
  },
  {
    name: "Casey CFO",
    email: "cfo@example.com",
    title: "CFO",
    status: "ACTIVE",
    isOnboarded: true,
  },
  {
    name: "Dana Lawyer",
    email: "lawyer@example.com",
    title: "Lawyer at Law Firm LLP",
    status: "PENDING",
    isOnboarded: false,
  },
  {
    name: "Ellis Accountant",
    email: "accountant@example.com",
    title: "Accountant at XYZ Accounting",
    status: "INACTIVE",
    isOnboarded: false,
  },
];

const seedTeam = async () => {
  console.log(`Seeding ${TEAM.length} team members`.blue);

  const companies = await db.company.findMany({ select: { id: true } });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("P@ssw0rd!", salt);

  for (const member of TEAM) {
    const user = await db.user.create({
      data: {
        name: member.name,
        email: member.email,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    await db.member.createMany({
      data: companies.map((company) => ({
        title: member.title,
        isOnboarded: member.isOnboarded ?? false,
        status: member.status as MemberStatusEnum,
        userId: user.id,
        companyId: company.id,
      })),
    });
  }

  console.log(
    `🎉 Seeded ${TEAM.length} team members across ${companies.length} companies`
      .green,
  );
  return TEAM;
};

export default seedTeam;
