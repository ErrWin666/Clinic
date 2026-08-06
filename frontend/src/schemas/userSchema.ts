import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  role: z.enum(["admin", "doctor", "receptionist", "viewer"]),
});

export const editUserSchema = z.object({
  username: z.string().min(3).max(50),
  role: z.enum(["admin", "doctor", "receptionist", "viewer"]),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .optional()
    .or(z.literal("")),
});

export type CreateUserForm = z.infer<typeof createUserSchema>;
export type EditUserForm = z.infer<typeof editUserSchema>;

export const USER_ROLES = ["admin", "doctor", "receptionist", "viewer"] as const;
