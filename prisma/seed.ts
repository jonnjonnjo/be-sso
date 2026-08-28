import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/utils/password.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number, h = 9) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.userApplication.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.application.deleteMany();
  await prisma.role.deleteMany();

  const adminRole = await prisma.role.create({ data: { name: "Admin" } });
  const userRole = await prisma.role.create({ data: { name: "User" } });

  const budi = await prisma.user.create({ data: { username: "budi", passwordHash: await hashPassword("budi123"), roleId: adminRole.id } });
  const siti = await prisma.user.create({ data: { username: "siti", passwordHash: await hashPassword("siti123"), roleId: userRole.id } });
  const andi = await prisma.user.create({ data: { username: "andi", passwordHash: await hashPassword("andi123"), roleId: userRole.id } });
  const rina = await prisma.user.create({ data: { username: "rina", passwordHash: await hashPassword("rina123"), roleId: userRole.id } });
  const joko = await prisma.user.create({ data: { username: "joko", passwordHash: await hashPassword("joko123"), roleId: adminRole.id } });

  const yellowPages = await prisma.application.create({ data: { name: "Yellow Pages", url: "/yellow-pages" } });
  const hrPortal = await prisma.application.create({ data: { name: "HR Portal", url: "/hr-portal" } });
  const docPortal = await prisma.application.create({ data: { name: "Document Portal", url: "/docs-portal" } });

  for (const [user, app] of [[budi, yellowPages], [budi, hrPortal], [siti, yellowPages], [andi, yellowPages], [joko, hrPortal], [joko, docPortal]] as const) {
    await prisma.userApplication.create({ data: { userId: user.id, applicationId: app.id } });
  }

  const contactsData = [
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
    { name: "Rizky Pratama", employeeId: "EMP011", department: "Engineering", parentDepartment: "Technology", position: "Backend Engineer", email: "rizky.pratama@company.com", phone: "105", location: "Jakarta" },
    { name: "Nina Saputra", employeeId: "EMP012", department: "HR", parentDepartment: "People", position: "HR Staff", email: "nina.saputra@company.com", phone: "203", location: "Bandung" },
    { name: "Hendra Gunawan", employeeId: "EMP013", department: "Finance", parentDepartment: "Operations", position: "Analyst", email: "hendra.gunawan@company.com", phone: "303", location: "Jakarta" },
    { name: "Putri Ayu", employeeId: "EMP014", department: "Marketing", parentDepartment: "Sales", position: "Designer", email: "putri.ayu@company.com", phone: "403", location: "Surabaya" },
    { name: "Bayu Anggara", employeeId: "EMP015", department: "Engineering", parentDepartment: "Technology", position: "Mobile Engineer", email: "bayu.anggara@company.com", phone: "106", location: "Jakarta" },
    { name: "Citra Kirana", employeeId: "EMP016", department: "HR", parentDepartment: "People", position: "Training Lead", email: "citra.kirana@company.com", phone: "204", location: "Jakarta" },
    { name: "Eko Nugroho", employeeId: "EMP017", department: "Finance", parentDepartment: "Operations", position: "Auditor", email: "eko.nugroho@company.com", phone: "304", location: "Bandung" },
    { name: "Sari Wulandari", employeeId: "EMP018", department: "Marketing", parentDepartment: "Sales", position: "SEO Specialist", email: "sari.wulandari@company.com", phone: "404", location: "Jakarta" },
    { name: "Dedi Kurniawan", employeeId: "EMP019", department: "Engineering", parentDepartment: "Technology", position: "SRE", email: "dedi.kurniawan@company.com", phone: "107", location: "Surabaya" },
    { name: "Anisa Rahma", employeeId: "EMP020", department: "Engineering", parentDepartment: "Technology", position: "Data Analyst", email: "anisa.rahma@company.com", phone: "108", location: "Bandung" },
  ];

  const createdContacts = [];
  for (const c of contactsData) {
    const contact = await prisma.contact.create({ data: { ...c, status: "ACTIVE" } });
    createdContacts.push(contact);
  }
  // deactivate 2 for demo (INACTIVE)
  await prisma.contact.update({ where: { id: createdContacts[13]!.id }, data: { status: "INACTIVE" } });
  await prisma.contact.update({ where: { id: createdContacts[18]!.id }, data: { status: "INACTIVE" } });

  // logical audit trail — 28 entries over last 7 days
  const logs = [
    { userId: budi.id, action: "LOGIN" as const, entity: "User", entityId: budi.id, detail: "login successful", createdAt: daysAgo(7, 8) },
    { userId: budi.id, action: "CREATE" as const, entity: "User", entityId: siti.id, detail: "created user siti", createdAt: daysAgo(7, 9) },
    { userId: budi.id, action: "CREATE" as const, entity: "User", entityId: andi.id, detail: "created user andi", createdAt: daysAgo(7, 10) },
    { userId: budi.id, action: "CREATE" as const, entity: "Application", entityId: yellowPages.id, detail: "created application Yellow Pages", createdAt: daysAgo(6, 9) },
    { userId: budi.id, action: "CREATE" as const, entity: "UserApplication", entityId: null, detail: `granted Yellow Pages to siti`, createdAt: daysAgo(6, 10) },
    { userId: budi.id, action: "CREATE" as const, entity: "UserApplication", entityId: null, detail: `granted Yellow Pages to andi`, createdAt: daysAgo(6, 11) },
    { userId: siti.id, action: "LOGIN" as const, entity: "User", entityId: siti.id, detail: "login successful", createdAt: daysAgo(5, 8) },
    { userId: siti.id, action: "CREATE" as const, entity: "Contact", entityId: createdContacts[0]!.id, detail: "created contact EMP001 Budi Santoso", createdAt: daysAgo(5, 9) },
    { userId: siti.id, action: "CREATE" as const, entity: "Contact", entityId: createdContacts[1]!.id, detail: "created contact EMP002 Siti Aminah", createdAt: daysAgo(5, 10) },
    { userId: andi.id, action: "LOGIN" as const, entity: "User", entityId: andi.id, detail: "login successful", createdAt: daysAgo(4, 8) },
    { userId: andi.id, action: "UPDATE" as const, entity: "Contact", entityId: createdContacts[2]!.id, detail: "updated contact EMP003 department HR", createdAt: daysAgo(4, 9) },
    { userId: budi.id, action: "UPDATE" as const, entity: "User", entityId: rina.id, detail: "updated user rina status ACTIVE", createdAt: daysAgo(4, 11) },
    { userId: joko.id, action: "LOGIN" as const, entity: "User", entityId: joko.id, detail: "login successful", createdAt: daysAgo(3, 8) },
    { userId: joko.id, action: "CREATE" as const, entity: "Contact", entityId: createdContacts[5]!.id, detail: "created contact EMP006 Dewi Lestari", createdAt: daysAgo(3, 9) },
    { userId: budi.id, action: "CREATE" as const, entity: "Contact", entityId: createdContacts[10]!.id, detail: "created contact EMP011 Rizky Pratama", createdAt: daysAgo(3, 14) },
    { userId: budi.id, action: "UPDATE" as const, entity: "Contact", entityId: createdContacts[10]!.id, detail: "updated contact EMP011 position Backend Engineer", createdAt: daysAgo(2, 9) },
    { userId: siti.id, action: "LOGOUT" as const, entity: "User", entityId: siti.id, detail: "logout", createdAt: daysAgo(2, 17) },
    { userId: budi.id, action: "UPDATE" as const, entity: "Contact", entityId: createdContacts[13]!.id, detail: "deactivated contact EMP014 Putri Ayu", createdAt: daysAgo(2, 15) },
    { userId: budi.id, action: "DELETE" as const, entity: "UserApplication", entityId: null, detail: "revoked HR Portal from andi", createdAt: daysAgo(2, 16) },
    { userId: andi.id, action: "LOGIN" as const, entity: "User", entityId: andi.id, detail: "login successful", createdAt: daysAgo(1, 8) },
    { userId: andi.id, action: "LOGOUT" as const, entity: "User", entityId: andi.id, detail: "logout", createdAt: daysAgo(1, 17) },
    { userId: rina.id, action: "LOGIN" as const, entity: "User", entityId: rina.id, detail: "login failed — no application access", createdAt: daysAgo(1, 9) },
    { userId: budi.id, action: "CREATE" as const, entity: "Contact", entityId: createdContacts[19]!.id, detail: "created contact EMP020 Anisa Rahma", createdAt: daysAgo(1, 10) },
    { userId: budi.id, action: "UPDATE" as const, entity: "Contact", entityId: createdContacts[18]!.id, detail: "deactivated contact EMP019 Dedi Kurniawan", createdAt: daysAgo(1, 14) },
    { userId: joko.id, action: "LOGIN" as const, entity: "User", entityId: joko.id, detail: "login successful", createdAt: daysAgo(0, 8) },
    { userId: joko.id, action: "CREATE" as const, entity: "Application", entityId: docPortal.id, detail: "created application Document Portal", createdAt: daysAgo(0, 9) },
    { userId: budi.id, action: "LOGIN" as const, entity: "User", entityId: budi.id, detail: "login successful", createdAt: daysAgo(0, 9) },
    { userId: budi.id, action: "LOGOUT" as const, entity: "User", entityId: budi.id, detail: "logout", createdAt: daysAgo(0, 18) },
  ];

  for (const l of logs) {
    await prisma.auditLog.create({ data: l });
  }

  console.log("Seed selesai ✅", {
    roles: [adminRole.name, userRole.name],
    users: [budi.username, siti.username, andi.username, rina.username, joko.username],
    apps: [yellowPages.name, hrPortal.name, docPortal.name],
    contacts: contactsData.length,
    auditLogs: logs.length,
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
