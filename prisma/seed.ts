import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/utils/password.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.userApplication.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.application.deleteMany();
  await prisma.role.deleteMany();

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

  const andi = await prisma.user.upsert({
    where: { username: "andi" },
    update: {},
    create: {
      username: "andi",
      passwordHash: await hashPassword("andi123"),
      roleId: userRole.id,
    },
  });

  const rina = await prisma.user.upsert({
    where: { username: "rina" },
    update: {},
    create: {
      username: "rina",
      passwordHash: await hashPassword("rina123"),
      roleId: userRole.id,
    },
  });

  const joko = await prisma.user.upsert({
    where: { username: "joko" },
    update: {},
    create: {
      username: "joko",
      passwordHash: await hashPassword("joko123"),
      roleId: adminRole.id,
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

  let hrPortal = await prisma.application.findFirst({
    where: { name: "HR Portal" },
  });
  if (!hrPortal) {
    hrPortal = await prisma.application.create({
      data: { name: "HR Portal", url: "/hr-portal" },
    });
  }

  let docPortal = await prisma.application.findFirst({
    where: { name: "Document Portal" },
  });
  if (!docPortal) {
    docPortal = await prisma.application.create({
      data: { name: "Document Portal", url: "/docs-portal" },
    });
  }

  for (const [user, app] of [
    [budi, yellowPages],
    [budi, hrPortal],
    [siti, yellowPages],
    [andi, yellowPages],
    [joko, hrPortal],
    [joko, docPortal],
  ] as const) {
    const exists = await prisma.userApplication.findFirst({
      where: { userId: user.id, applicationId: app.id },
    });
    if (!exists) {
      await prisma.userApplication.create({
        data: { userId: user.id, applicationId: app.id },
      });
    }
  }

  console.log("Seed selesai ✅", {
    roles: [adminRole.name, userRole.name],
    users: [budi.username, siti.username, andi.username, rina.username, joko.username],
    apps: [yellowPages.name, hrPortal.name, docPortal.name],
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
