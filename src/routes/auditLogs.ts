import { Router } from "express";
import { prisma } from "../db.js";
import { successWithMeta } from "../utils/response.js";

export const auditLogRouter = Router()

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     tags: [AuditLogs]
 *     summary: List audit logs (Admin) — filter by user/action/entity, pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [LOGIN, LOGOUT, CREATE, UPDATE, DELETE] }
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
auditLogRouter.get("/", async (req, res) => {
  const { userId, action, entity, page = "1", limit = "20" } = req.query as any;
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const take = Math.min(100, Math.max(1, parseInt(limit)));

  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entity) where.entity = entity;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, username: true } } }
    }),
    prisma.auditLog.count({ where })
  ]);

  return successWithMeta(res, "Get audit logs", data, { total, page: parseInt(page), limit: take });
})
