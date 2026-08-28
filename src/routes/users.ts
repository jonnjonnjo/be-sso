import { Router } from "express";
import { prisma } from "../db.js";
import { fail, success, successWithMeta } from "../utils/response.js";
import { hashPassword } from "../utils/password.js";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitize.js";
import { validate } from "../middlewares/validate.js";
import { createUserSchema, updateUserSchema } from "../validators/schemas.js";

export const userRouter = Router()

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin)
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
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
userRouter.get("/", async (req, res) => {
  const page = Math.max(1, parseInt((req.query.page as string) || "1"));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20")));
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, username: true, passwordHash: true, activeStatus: true, role: { select: { id: true, name: true } }, createdAt: true, updatedAt: true },
      skip, take: limit, orderBy: { createdAt: "desc" }
    }),
    prisma.user.count()
  ]);
  return successWithMeta(res, "Get users successful", sanitizeUsers(data as any), { total, page, limit });
})

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User detail
 *       404:
 *         description: Not found
 */
userRouter.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, passwordHash: true, activeStatus: true, role: { select: { id: true, name: true } }, createdAt: true, updatedAt: true }
  });
  if (!user) return fail(res, "User not found", undefined, 404);
  return success(res, "Get user", sanitizeUser(user as any));
})

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create user (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: andi }
 *               password: { type: string, example: andi123 }
 *               roleId: { type: string, description: Role ID (defaults to User if omitted) }
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Username exists
 */
userRouter.post("/", validate(createUserSchema), async (req, res) => {
  const { username, password, roleId } = req.body as {
    username?: string; password?: string; roleId?: string;
  };

  // Default to User
  let role;
  if (roleId) role = await prisma.role.findUnique({ where: { id: roleId } });
  else role = await prisma.role.findUnique({ where: { name: "User" } });
  if (!role) return fail(res, "Role not found", undefined, 404);

  const exists = await prisma.user.findUnique({ where: { username: username! } });
  if (exists) return fail(res, "Username already exists", undefined, 409);

  const passwordHash = await hashPassword(password!);
  const user = await prisma.user.create({
    data: { username: username!, passwordHash, roleId: role.id },
    select: { id: true, username: true, passwordHash: true, activeStatus: true, role: { select: { name: true } }, createdAt: true },
  });

  // log
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "CREATE", entity: "User", entityId: user.id, detail: `created user ${username}` },
  });
  return success(res, "User created", sanitizeUser(user as any), 201);
})

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user (Admin) — username / role / activeStatus / password
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
 *               username: { type: string }
 *               roleId: { type: string }
 *               activeStatus: { type: string, enum: [ACTIVE, INACTIVE] }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
userRouter.patch("/:id", validate(updateUserSchema), async (req, res) => {
  const id = req.params.id as string;

  const { username, roleId, activeStatus, password } = req.body as {
    username?: string; roleId?: string; activeStatus?: "ACTIVE" | "INACTIVE"; password?: string;
  };
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return fail(res, "User not found", undefined, 404);
  const data: any = {};
  if (username) {
    if (username !== existing.username) {
      const dup = await prisma.user.findUnique({ where: { username } });
      if (dup) return fail(res, "Username already exists", undefined, 409);
    }
    data.username = username;
  }
  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return fail(res, "Role not found", undefined, 404);
    data.roleId = role.id;
  }
  if (activeStatus) {
    data.activeStatus = activeStatus;
  }
  if (password) {
    data.passwordHash = await hashPassword(password);
  }
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, passwordHash: true, activeStatus: true, role: { select: { name: true } }, updatedAt: true },
  });

  // log
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "UPDATE", entity: "User", entityId: id, detail: `updated user ${id}` },
  });
  return success(res, "User updated", sanitizeUser(user as any));
})
