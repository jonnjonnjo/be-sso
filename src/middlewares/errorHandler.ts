import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // malformed JSON from express.json()
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }

  // Prisma unique violation
  if (err?.code === "P2002") {
    return res.status(409).json({ success: false, message: "Duplicate entry" });
  }

  // Prisma record not found (e.g. update non-existent)
  if (err?.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found" });
  }

  const status = err?.status || err?.statusCode || 500;
  const message = status === 500
    ? "Internal server error"
    : (err.message || "Something went wrong");

  if (status === 500) console.error(err);

  return res.status(status).json({ success: false, message });
}
