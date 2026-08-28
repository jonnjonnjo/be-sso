import { Router } from "express";
import { prisma } from "../db.js";
import { success } from "../utils/response.js";

export const roleRouter = Router();

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List roles (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
roleRouter.get("/", async (_req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  return success(res, "Get roles", roles);
});
