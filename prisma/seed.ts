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

  // dummy contacts — Yellow Pages
  const contacts = [
    { name: "Budi Santoso", employeeId: "EMP001", department: "Engineering", parentDepartment: "Technology", position: "Senior Engineer", email: "budi.santoso@company.com", phone: "101", location: "Jakarta" },
    { name: "Siti Aminah", employeeId: "EMP002", department: "Engineering", parentDepartment: "Technology", position: "Frontend Engineer", email: "siti.aminah@company.com", phone: "102", location: "Bandung" },
    { name: "Andi Wijaya", employeeId: "EMP003", department: "HR", parentDepartment: "People", position: "HR Manager", email: "andi.wijaya@company.com", phone: "201", location: "Jakarta" },
    { name: "Rina Marlina", employeeId: "EMP004", department: "HR", parentDepartment: "People", position: "Recruiter", email: "rina.marlina@company.com", phone: "202", location: "Surabaya" },
    { name: "Joko Prabowo", employeeId: "EMP005", department: "Finance", parentDepartment: "Operations", position: "Finance Manager", email: "joko.prabowo@company.com", phone: "301", location: "Jakarta" },
    { name: "Dewi Lestari", employeeId: "EMP006", department: "Finance", parentDepartment: "Operations", position: "Accountant", email: "dewi.lestari@company.com", phone: "302", location: "Bandung" },
    { name: "Agus Hermawan", employeeId: "EMP007", department: "Marketing", parentDepartment: "Sales", position: "Marketing Lead", email: "agus.hermawan@company.com", phone: "401", location: "Surabaya" },
    { name: "Maya Sari", employeeId: "EMP008", department: "Marketing", parentDepartment: "Sales", position: "Content Strategist", email: "maya.sari@company.com", phone: "402", location: "Jakarta" },
    { name: "Farhan Yusuf", employeeId: "EMP009", department: "Engineering", parentDepartment: "Technology", position: "DevOps Engineer", email: "farhan.yusuf@company.com", phone: "103", location: "Surabaya" },
    { name: "Lina Hartati", employeeId: "EMP010", department: "Engineering", parentDepartment: "Technology", position: "QA Engineer", email: "lina.hartati@company.com", phone: "104", location: "Bandung" },
  ];

  for (const c of contacts) {
    await prisma.contact.create({ data: { ...c, status: "ACTIVE" } });
  }

  console.log("Seed selesai ✅", {
    roles: [adminRole.name, userRole.name],
    users: [budi.username, siti.username, andi.username, rina.username, joko.username],
    apps: [yellowPages.name, hrPortal.name, docPortal.name],
    contacts: contacts.length,
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
