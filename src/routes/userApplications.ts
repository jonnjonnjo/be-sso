import { Router } from "express";
import { prisma } from "../db.js";
import { fail, success } from "../utils/response.js";

export const userApplicationRouter = Router({ mergeParams: true })

/**
 * @openapi
 * /users/{id}/applications:
 *   get:
 *     tags: [UserApplications]
 *     summary: List applications accessible by user (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of applications
 *       404:
 *         description: User not found
 */
userApplicationRouter.get("/", async (req, res) => {
  const { id } = req.params as { id: string };
  const user = await prisma.user.findUnique({
    where: { id },
    include: { userApplications: { include: { application: true } } }
  });
  if (!user) return fail(res, "User not found", undefined, 404);
  const apps = user.userApplications.map(ua => ua.application);
  return success(res, "Get user applications", apps);
})

/**
 * @openapi
 * /users/{id}/applications:
 *   post:
 *     tags: [UserApplications]
 *     summary: Grant application access to user (Admin)
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
 *             required: [applicationId]
 *             properties:
 *               applicationId: { type: string }
 *     responses:
 *       201:
 *         description: Access granted
 *       404:
 *         description: User or Application not found
 *       409:
 *         description: Already has access
 */
userApplicationRouter.post("/", async (req, res) => {
  const { id } = req.params as { id: string };
  const { applicationId } = req.body as { applicationId?: string };
  if (!applicationId?.trim()) return fail(res, "applicationId is required", undefined, 400);

  const [user, app] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.application.findUnique({ where: { id: applicationId } })
  ]);
  if (!user) return fail(res, "User not found", undefined, 404);
  if (!app) return fail(res, "Application not found", undefined, 404);

  const exists = await prisma.userApplication.findUnique({
    where: { userId_applicationId: { userId: id, applicationId } }
  });
  if (exists) return fail(res, "User already has access", undefined, 409);

  await prisma.userApplication.create({ data: { userId: id, applicationId } });
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({ data: { userId: actor.id, action: "CREATE", entity: "UserApplication", entityId: `${id}:${applicationId}` } });
  return success(res, "Access granted", { userId: id, applicationId }, 201);
})

/**
 * @openapi
 * /users/{id}/applications/{appId}:
 *   delete:
 *     tags: [UserApplications]
 *     summary: Revoke application access (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: appId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Access revoked
 *       404:
 *         description: Grant not found
 */
userApplicationRouter.delete("/:appId", async (req, res) => {
  const { id, appId } = req.params as { id: string; appId: string };
  const grant = await prisma.userApplication.findUnique({
    where: { userId_applicationId: { userId: id, applicationId: appId } }
  });
  if (!grant) return fail(res, "Grant not found", undefined, 404);
  await prisma.userApplication.delete({
    where: { userId_applicationId: { userId: id, applicationId: appId } }
  });
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({ data: { userId: actor.id, action: "DELETE", entity: "UserApplication", entityId: `${id}:${appId}` } });
  return success(res, "Access revoked", {});
})
