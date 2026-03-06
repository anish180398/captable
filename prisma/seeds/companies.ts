import { generatePublicId } from "@/common/id";
import { db } from "@/server/db";
import colors from "colors";
colors.enable();

const COMPANIES = [
  {
    name: "Acme Corp",
    publicId: generatePublicId(),
    incorporationType: "c-corp",
    incorporationDate: new Date("2018-03-15"),
    incorporationState: "DE",
    incorporationCountry: "US",
    streetAddress: "1 Infinite Loop",
    city: "Cupertino",
    state: "CA",
    zipcode: "95014",
    country: "US",
  },
  {
    name: "Stellar Dynamics",
    publicId: generatePublicId(),
    incorporationType: "c-corp",
    incorporationDate: new Date("2019-07-22"),
    incorporationState: "DE",
    incorporationCountry: "US",
    streetAddress: "100 Main Street",
    city: "Austin",
    state: "TX",
    zipcode: "78701",
    country: "US",
  },
  {
    name: "NovaTech Solutions",
    publicId: generatePublicId(),
    incorporationType: "c-corp",
    incorporationDate: new Date("2020-01-10"),
    incorporationState: "DE",
    incorporationCountry: "US",
    streetAddress: "200 Market Street",
    city: "San Francisco",
    state: "CA",
    zipcode: "94105",
    country: "US",
  },
  {
    name: "Beacon Ventures",
    publicId: generatePublicId(),
    incorporationType: "llc",
    incorporationDate: new Date("2017-11-05"),
    incorporationState: "NY",
    incorporationCountry: "US",
    streetAddress: "55 Water Street",
    city: "New York",
    state: "NY",
    zipcode: "10041",
    country: "US",
  },
  {
    name: "Horizon Labs",
    publicId: generatePublicId(),
    incorporationType: "c-corp",
    incorporationDate: new Date("2021-05-18"),
    incorporationState: "DE",
    incorporationCountry: "US",
    streetAddress: "401 Congress Ave",
    city: "Boston",
    state: "MA",
    zipcode: "02101",
    country: "US",
  },
];

const seedCompanies = async () => {
  console.log(`Seeding ${COMPANIES.length} companies`.blue);

  await db.company.createMany({ data: COMPANIES });

  const companies = await db.company.findMany({
    where: { name: { in: COMPANIES.map((c) => c.name) } },
  });

  console.log(`🎉 Seeded ${companies.length} companies`.green);
  return companies;
};

export default seedCompanies;
