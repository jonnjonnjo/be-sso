import { Router } from "express";
import { prisma } from "../db.js";
import { fail, success } from "../utils/response.js";
import { hashPassword } from "../utils/password.js";

export const userRouter = Router()

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
userRouter.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, activeStatus: true, role: { select: { id: true, name: true } }, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" }
  });
  return success(res, "Get users successful", users)
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
userRouter.post("/", async (req, res) => {
  const { username, password, roleId } = req.body as {
    username?: string; password?: string; roleId?: string;
  };
  if (!username?.trim() || !password?.trim()) return fail(res, "username and password are required", undefined, 400);

  // Default to User
  let role;
  if (roleId) role = await prisma.role.findUnique({ where: { id: roleId } });
  else role = await prisma.role.findUnique({ where: { name: "User" } });
  if (!role) return fail(res, "Role not found", undefined, 404);

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return fail(res, "Username already exists", undefined, 409);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, passwordHash, roleId: role.id },
    select: { id: true, username: true, activeStatus: true, role: { select: { name: true } }, createdAt: true },
  });

  // log
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "CREATE", entity: "User", entityId: user.id, detail: `created user ${username}` },
  });
  return success(res, "User created", user, 201);
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
userRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;

  const { username, roleId, activeStatus, password } = req.body as {
    username?: string; roleId?: string; activeStatus?: "ACTIVE" | "INACTIVE"; password?: string;
  };

  if (!username && !roleId && !activeStatus && password === undefined) {
    return fail(res, "At least one field is required: username, roleId, activeStatus, password", undefined, 400);
  }
  if (password !== undefined && !password.trim()) {
    return fail(res, "password cannot be empty", undefined, 400);
  }
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
    if (!["ACTIVE", "INACTIVE"].includes(activeStatus)) return fail(res, "activeStatus must be ACTIVE or INACTIVE", undefined, 400);
    data.activeStatus = activeStatus;
  }
  if (password) {
    data.passwordHash = await hashPassword(password);
  }
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, activeStatus: true, role: { select: { name: true } }, updatedAt: true },
  });

  // log
  const actor = (req as any).user as { id: string };
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "UPDATE", entity: "User", entityId: id, detail: `updated user ${id}` },
  });
  return success(res, "User updated", user);
})
