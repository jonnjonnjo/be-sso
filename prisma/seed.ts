import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/utils/password.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: { name: "User" },
  });

  const budi = await prisma.user.upsert({
    where: { username: "budi" },
    update: {},
    create: {
      username: "budi",
      passwordHash: await hashPassword("budi123"),
      roleId: adminRole.id,
    },
  });

  const siti = await prisma.user.upsert({
    where: { username: "siti" },
    update: {},
    create: {
      username: "siti",
      passwordHash: await hashPassword("siti123"),
      roleId: userRole.id,
    },
  });

  let yellowPages = await prisma.application.findFirst({
    where: { name: "Yellow Pages" },
  });
  if (!yellowPages) {
    yellowPages = await prisma.application.create({
      data: { name: "Yellow Pages", url: "/yellow-pages" },
    });
  }

  const grant = await prisma.userApplication.findFirst({
    where: { userId: budi.id, applicationId: yellowPages.id },
  });
  if (!grant) {
    await prisma.userApplication.create({
      data: { userId: budi.id, applicationId: yellowPages.id },
    });
  }

  console.log("Seed selesai ✅", {
    roles: [adminRole.name, userRole.name],
    users: [budi.username, siti.username],
    app: yellowPages.name,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
