import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().trim().min(1, "username is required"),
  password: z.string().trim().min(1, "password is required"),
  roleId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  username: z.string().trim().min(1).optional(),
  roleId: z.string().uuid().optional(),
  activeStatus: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  password: z.string().trim().min(1).optional(),
}).refine(v => Object.keys(v).length > 0, { message: "At least one field is required" });

export const createAppSchema = z.object({
  name: z.string().trim().min(1),
  url: z.string().trim().optional().nullable(),
});

export const createContactSchema = z.object({
  name: z.string().trim().min(1),
  employeeId: z.string().trim().min(1),
  department: z.string().trim().min(1),
  parentDepartment: z.string().trim().optional().nullable(),
  position: z.string().trim().min(1),
  email: z.string().trim().email().optional().nullable().or(z.literal("").transform(() => null)),
  phone: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
});
