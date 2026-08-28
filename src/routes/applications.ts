import { Router } from "express";
import { prisma } from "../db.js";
import { fail, success, successWithMeta } from "../utils/response.js";

export const applicationRouter = Router()

/**
 * @openapi
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: List applications (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of applications
 */
applicationRouter.get("/", async (req, res) => {
  const page = Math.max(1, parseInt((req.query.page as string) || "1"));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20")));
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.application.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.application.count()
  ]);
  return successWithMeta(res, "Get applications successful", data, { total, page, limit });
})

/**
 * @openapi
 * /applications:
 *   post:
 *     tags: [Applications]
 *     summary: Create application (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: HR Portal }
 *               url: { type: string, example: /hr-portal }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Already exists
 */
applicationRouter.post("/", async (req, res) => {
  const { name, url } = req.body as { name?: string; url?: string };
  if (!name?.trim()) return fail(res, "name is required", undefined, 400);

  const cleanName = name.trim();
  const cleanUrl = url?.trim() || null;

  const exists = await prisma.application.findFirst({ where: { name: cleanName } });
  if (exists) return fail(res, "Application already exists", undefined, 409);

  const app = await prisma.application.create({ data: { name: cleanName, url: cleanUrl } });

  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "CREATE", entity: "Application", entityId: app.id, detail: `created app ${cleanName}` },
  });

  return success(res, "Application created", app, 201);
})

/**
 * @openapi
 * /applications/{id}:
 *   patch:
 *     tags: [Applications]
 *     summary: Update application (Admin)
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
 *               url: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
applicationRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, url } = req.body as { name?: string; url?: string };
  if (name === undefined && url === undefined) return fail(res, "At least one field required", undefined, 400);

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return fail(res, "Application not found", undefined, 404);

  const data: any = {};
  if (name !== undefined) {
    if (!name.trim()) return fail(res, "name cannot be empty", undefined, 400);
    data.name = name.trim();
  }
  if (url !== undefined) data.url = url.trim() || null;

  const app = await prisma.application.update({ where: { id }, data });

  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "UPDATE", entity: "Application", entityId: id },
  });

  return success(res, "Application updated", app);
})
