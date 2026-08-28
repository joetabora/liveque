import { z } from "zod";
import { parsePromotionVideoUrl } from "@/lib/promotion-video";

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
  logoUrl: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        val.startsWith("/") ||
        z.string().url().safeParse(val).success,
      { message: "Logo must be a valid URL or site path (e.g. /logo.png)" }
    )
    .optional(),
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
  layout: z.enum(["default", "compact", "portrait"]).optional(),
});

const optionalPromotionUrl = z.union([z.string().url(), z.literal("")]).optional();

function validatePromotionMedia(
  data: { imageUrl?: string; videoUrl?: string },
  ctx: z.RefinementCtx,
  requireMedia: boolean
) {
  const image = data.imageUrl?.trim() ?? "";
  const video = data.videoUrl?.trim() ?? "";

  if (requireMedia && !image && !video) {
    ctx.addIssue({
      code: "custom",
      message: "Provide an image URL or a YouTube/TikTok video link",
      path: ["imageUrl"],
    });
  }

  if (video && !parsePromotionVideoUrl(video)) {
    ctx.addIssue({
      code: "custom",
      message: "Video link must be a supported YouTube or TikTok URL",
      path: ["videoUrl"],
    });
  }
}

export const promotionCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    subtitle: z.string().max(300).optional(),
    imageUrl: optionalPromotionUrl,
    videoUrl: optionalPromotionUrl,
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => validatePromotionMedia(data, ctx, true));

export const promotionUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(300).nullable().optional(),
    imageUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
    videoUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    validatePromotionMedia(
      {
        imageUrl: data.imageUrl ?? undefined,
        videoUrl: data.videoUrl ?? undefined,
      },
      ctx,
      data.imageUrl !== undefined && data.videoUrl !== undefined
    );
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
