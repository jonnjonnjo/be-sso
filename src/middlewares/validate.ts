import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response.js";

export function validate(schema: z.ZodTypeAny, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "_";
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }
      return fail(res, "Validation failed", errors, 400);
    }
    (req as any)[source] = result.data;
    next();
  };
}
