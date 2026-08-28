/**
 * Sanitize helpers — ensure no sensitive/internal fields leak in JSON responses.
 * Dates kept as ISO-tidy (no millis) so FE can format itself.
 */

function tidyDate(d: any): string | any {
  if (!(d instanceof Date)) return d;
  return d.toISOString().replace(/\.\d+Z$/, "Z");
}

export function sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash, createdAt, updatedAt, ...rest } = user as any;
  return {
    ...rest,
    ...(createdAt ? { createdAt: tidyDate(createdAt) } : {}),
    ...(updatedAt ? { updatedAt: tidyDate(updatedAt) } : {}),
  } as any;
}

export function sanitizeUsers<T extends Record<string, any>>(users: T[]) {
  return users.map(sanitizeUser);
}

// generic: strip listed keys
export function strip<T extends Record<string, any>>(obj: T, ...keys: string[]) {
  const copy = { ...obj };
  for (const k of keys) delete (copy as any)[k];
  return copy;
}
