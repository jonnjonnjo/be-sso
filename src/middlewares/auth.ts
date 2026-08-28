
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../env.js";
import { fail } from "../utils/response.js";

export interface AuthPayload {
  id: string;
  role: string;
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", undefined, 401);
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    return fail(res, "Invalid or expired token", undefined, 401);
  }
}
