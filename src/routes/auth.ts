import { Router } from "express";
import { prisma } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fail, success } from "../utils/response.js";
import { JWT_SECRET } from "../env.js";
import { auth } from "../middlewares/auth.js";

export const authRouter = Router()

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: budi }
 *               password: { type: string, example: budi123 }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is inactive
 */
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      passwordHash: true,
      activeStatus: true,
      role: { select: { name: true } },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return fail(res, "Invalid credentials", undefined, 401);
  }

  if (user.activeStatus !== "ACTIVE") {
    return fail(res, "Account is inactive", undefined, 403);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role.name },
    JWT_SECRET,
    { expiresIn: 60 * 60 * 24 },);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
    },
  });

  success(res, "Login successful", { token });
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (audit only, client drops token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
authRouter.post("/logout", auth, async (req, res) => {
  const user = (req as any).user as { id: string };

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGOUT",
      entity: "User",
      entityId: user.id,
    },
  });

  success(res, "Logout successful", {});
});
