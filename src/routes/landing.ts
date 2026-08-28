import { Router } from "express";
import { prisma } from "../db.js";
import { auth } from "../middlewares/auth.js";
import { success, fail } from "../utils/response.js";

export const landingRouter = Router();

/**
 * @openapi
 * /landing:
 *   get:
 *     tags: [Landing]
 *     summary: Get current user + accessible applications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User and apps
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account is inactive
 */
landingRouter.get("/", auth, async (req, res) => {
  const { id } = (req as any).user as { id: string };

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      activeStatus: true,
      role: { select: { name: true } },
      userApplications: {
        select: { application: { select: { id: true, name: true, url: true } } }
      }
    }
  });

  if (!user) return fail(res, "User not found", undefined, 404);

  if (user.activeStatus !== "ACTIVE") {
    return fail(res, "Account is inactive", undefined, 403);
  }

  const applications = user.userApplications.map(ua => ua.application);

  success(res, "OK", {
    user: { id: user.id, username: user.username, status: user.activeStatus, role: user.role.name },
    applications
  });
});
