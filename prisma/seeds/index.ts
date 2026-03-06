import { db } from "@/server/db";
import colors from "colors";
import inquirer from "inquirer";
colors.enable();

import type { QuestionCollection } from "inquirer";
import seedCompanies from "./companies";
import seedEquityPlans from "./equity-plans";
import seedSecurities from "./securities";
import seedShareClasses from "./share-classes";
import seedStakeholders from "./stakeholders";
import seedTeam from "./team";

if (process.env.NODE_ENV === "production") {
  console.log("❌ You cannot run this command on production".red);
  process.exit(0);
}

const seed = async () => {
  const inquiry = await inquirer.prompt({
    type: "confirm",
    name: "answer",
    message: "Are you sure you want to NUKE 🚀 and re-seed the database?",
  } as QuestionCollection);

  const answer = inquiry.answer as boolean;

  if (answer) {
    await nuke();

    console.log("\nSeeding database...".underline.cyan);
    await seedCompanies();
    await seedTeam();
    await seedStakeholders();
    await seedShareClasses();
    await seedEquityPlans();
    await seedSecurities();
  } else {
    throw new Error("Seeding aborted");
  }
};

const nuke = () => {
  console.log("🚀 Nuking database records".yellow);
  return db.$transaction(async (tx) => {
    await tx.option.deleteMany();
    await tx.share.deleteMany();
    await tx.equityPlan.deleteMany();
    await tx.shareClass.deleteMany();
    await tx.stakeholder.deleteMany();
    await tx.document.deleteMany();
    await tx.bucket.deleteMany();
    await tx.template.deleteMany();
    await tx.audit.deleteMany();
    await tx.member.deleteMany();
    await tx.session.deleteMany();
    await tx.user.deleteMany();
    await tx.company.deleteMany();
  });
};

await seed()
  .then(async () => {
    console.log("\n✅ Database seeding completed!\n".green);
    console.log(
      "💌 Login with any of these accounts (password: P@ssw0rd!):\n".cyan,
      "ceo@example.com\n".underline.yellow,
      "cto@example.com\n".underline.yellow,
      "cfo@example.com\n".underline.yellow,
    );
    console.log(
      "📊 Seeded data:\n".cyan,
      "- 5 companies\n",
      "- 5 team members (each member of all companies)\n",
      "- 8 stakeholders per company (founders, investors, employees, advisors)\n",
      "- 2 share classes per company (Common + Series A Preferred)\n",
      "- 1 equity plan per company\n",
      "- 4 share grants + 4 option grants per company\n",
    );
    await db.$disconnect();
  })
  .catch(async (error: Error) => {
    console.log(`❌ ${error.message}`.red);
    await db.$disconnect();
    process.exit(1);
  });
