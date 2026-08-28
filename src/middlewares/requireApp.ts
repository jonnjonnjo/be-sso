import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { fail } from "../utils/response.js";

export function requireApp(appName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { id: string; role: string };
    if (user.role === "Admin") return next();

    const app = await prisma.application.findFirst({ where: { name: appName } });
    if (!app) return fail(res, "Application not found", undefined, 404);

    const grant = await prisma.userApplication.findUnique({
      where: { userId_applicationId: { userId: user.id, applicationId: app.id } }
    });
    if (!grant) return fail(res, "Forbidden: no access to this application", undefined, 403);

    next();
  };
}
