import { Router } from "express";
import { prisma } from "../db.js";
import { fail, success, successWithMeta } from "../utils/response.js";
import { requireRole } from "../middlewares/requireRole.js";

export const contactRouter = Router()

/**
 * @openapi
 * /contacts:
 *   get:
 *     tags: [Contacts]
 *     summary: List contacts — search q, filter department/location, pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name or employeeId
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated contacts
 */
contactRouter.get("/", async (req, res) => {
  const { q, department, location, status, page = "1", limit = "20" } = req.query as any;
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const take = Math.min(100, Math.max(1, parseInt(limit)));

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { employeeId: { contains: q, mode: "insensitive" } },
    ];
  }
  if (department) where.department = department;
  if (location) where.location = location;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.contact.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.contact.count({ where })
  ]);

  return successWithMeta(res, "Get contacts", data, { total, page: parseInt(page), limit: take });
})

/**
 * @openapi
 * /contacts/{id}:
 *   get:
 *     tags: [Contacts]
 *     summary: Get contact detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contact detail
 *       404:
 *         description: Not found
 */
contactRouter.get("/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return fail(res, "Contact not found", undefined, 404);
  return success(res, "Get contact", contact);
})

/**
 * @openapi
 * /contacts:
 *   post:
 *     tags: [Contacts]
 *     summary: Create contact (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, employeeId, department, position]
 *             properties:
 *               name: { type: string, example: Rudi Hartono }
 *               employeeId: { type: string, example: EMP100 }
 *               department: { type: string, example: Engineering }
 *               parentDepartment: { type: string, example: Technology }
 *               position: { type: string, example: Backend Engineer }
 *               email: { type: string, example: rudi.hartono@company.com }
 *               phone: { type: string, example: "105" }
 *               location: { type: string, example: Jakarta }
 *     responses:
 *       201:
 *         description: Created
 */
contactRouter.post("/", requireRole("Admin"), async (req, res) => {
  const { name, employeeId, department, parentDepartment, position, email, phone, location } = req.body;
  if (!name?.trim() || !employeeId?.trim() || !department?.trim() || !position?.trim()) {
    return fail(res, "name, employeeId, department, position are required", undefined, 400);
  }
  const exists = await prisma.contact.findUnique({ where: { employeeId: employeeId.trim() } });
  if (exists) return fail(res, "employeeId already exists", undefined, 409);

  const contact = await prisma.contact.create({
    data: {
      name: name.trim(),
      employeeId: employeeId.trim(),
      department: department.trim(),
      parentDepartment: parentDepartment?.trim() || null,
      position: position.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      location: location?.trim() || null,
      status: "ACTIVE",
    }
  });
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({ data: { userId: actor.id, action: "CREATE", entity: "Contact", entityId: contact.id } });
  return success(res, "Contact created", contact, 201);
})

/**
 * @openapi
 * /contacts/{id}:
 *   patch:
 *     tags: [Contacts]
 *     summary: Update contact (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               department: { type: string }
 *               parentDepartment: { type: string }
 *               position: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               location: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
contactRouter.patch("/:id", requireRole("Admin"), async (req, res) => {
  const { id } = req.params as { id: string };
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return fail(res, "Contact not found", undefined, 404);

  const { name, department, parentDepartment, position, email, phone, location } = req.body;
  const data: any = {};
  if (name !== undefined) data.name = name.trim();
  if (department !== undefined) data.department = department.trim();
  if (parentDepartment !== undefined) data.parentDepartment = parentDepartment?.trim() || null;
  if (position !== undefined) data.position = position.trim();
  if (email !== undefined) data.email = email?.trim() || null;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (location !== undefined) data.location = location?.trim() || null;

  if (Object.keys(data).length === 0) return fail(res, "No fields to update", undefined, 400);

  const contact = await prisma.contact.update({ where: { id }, data });
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({ data: { userId: actor.id, action: "UPDATE", entity: "Contact", entityId: id } });
  return success(res, "Contact updated", contact);
})

/**
 * @openapi
 * /contacts/{id}/deactivate:
 *   patch:
 *     tags: [Contacts]
 *     summary: Deactivate contact (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deactivated
 */
contactRouter.patch("/:id/deactivate", requireRole("Admin"), async (req, res) => {
  const { id } = req.params as { id: string };
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return fail(res, "Contact not found", undefined, 404);
  if (contact.status === "INACTIVE") return fail(res, "Already inactive", undefined, 400);
  const updated = await prisma.contact.update({ where: { id }, data: { status: "INACTIVE" } });
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({ data: { userId: actor.id, action: "UPDATE", entity: "Contact", entityId: id, detail: "deactivated" } });
  return success(res, "Contact deactivated", updated);
})
