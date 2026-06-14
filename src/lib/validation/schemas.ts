import { z } from "zod";

export const queueItemInputSchema = z.object({
  name: z.string().min(1).max(200),
  hereToSee: z.string().max(200).optional(),
  serviceType: z.string().max(100).optional(),
});

export const queueItemUpdateSchema = z.object({
  name: z.string().min(1).max(200),
  hereToSee: z.string().max(200).optional(),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      position: z.number(),
    })
  ),
});

export const checkInSchema = z.object({
  name: z.string().min(1).max(200),
  hereToSee: z.string().max(200).optional(),
  serviceType: z.string().max(100).optional(),
});

export const tenantBrandingSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  welcomeMessage: z.string().max(200).optional(),
  displayHeadline: z.string().max(200).optional(),
});

export const displayCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  layout: z.enum(["default", "compact"]).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "staff"]),
});

export const onboardingTenantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

export const checkoutSchema = z.object({
  planTier: z.enum(["starter", "professional"]),
  tenantId: z.string().uuid().optional(),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(200),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
