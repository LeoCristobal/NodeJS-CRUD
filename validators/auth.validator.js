import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({
      error: "User name is required",
    })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name is too long"),

  email: z
    .email("Please provide a valid email address")
    .min(5, "Email is too short")
    .max(255, "Email is too long")
    .transform((email) => email.toLowerCase().trim()),

  password: z
    .string({
      error: "Password is required",
    })
    .min(5, "Password is too short")
    .max(255, "Password is too long"),
});

export const loginSchema = z.object({
  email: z
    .email("Please provide a valid email address")
    .min(5, "Email is too short")
    .max(255, "Email is too long")
    .transform((email) => email.toLowerCase().trim()),

  password: z
    .string({
      error: "Password is required",
    })
    .min(5, "Password is too short")
    .max(255, "Password is too long"),
});
