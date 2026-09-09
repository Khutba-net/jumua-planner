import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(1, "Password is required").max(128),
  invite_code: z.string().max(20).optional(),
});

const strongPassword = z.string().min(8, "Password must be at least 8 characters").max(128)
  .refine(p => /[A-Z]/.test(p), "Password must include an uppercase letter")
  .refine(p => /[a-z]/.test(p), "Password must include a lowercase letter")
  .refine(p => /[0-9]/.test(p), "Password must include a number")
  .refine(p => /[^A-Za-z0-9]/.test(p), "Password must include a special character (!@#$...)");

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format").max(255),
  password: strongPassword,
});

export const resetPasswordSchema = z.object({
  token: z.string().length(64, "Invalid reset token"),
  password: strongPassword,
});

export const sermonCreateSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().max(100_000).optional(),
  outline: z.string().max(50_000).optional(),
  status: z.enum(["draft", "ready", "delivered", "archived", "skipped"]).optional(),
  type: z.enum(["friday", "eid", "talk", "other"]).optional(),
  scheduledDate: z.string().max(20).nullable().optional(),
  notes: z.string().max(10_000).optional(),
  mosqueId: z.string().max(50).nullable().optional(),
  themeId: z.string().max(50).nullable().optional(),
  subTopicId: z.string().max(50).nullable().optional(),
});

export const sermonUpdateSchema = sermonCreateSchema;

export const themeCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  color: z.string().max(20).optional(),
  subTopics: z.array(z.object({
    name: z.string().min(1).max(200),
    week: z.number().int().min(1).max(52),
  })).max(16).optional(),
});

export const themeUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  month: z.number().int().min(1).max(12).optional(),
  color: z.string().max(20).optional(),
  subTopics: z.array(z.object({
    name: z.string().min(1).max(200),
    week: z.number().int().min(1).max(52),
  })).max(16).optional(),
});

export const settingsProfileSchema = z.object({
  section: z.literal("profile"),
  name: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  bio: z.string().max(1000).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
});

export const settingsSermonSchema = z.object({
  section: z.literal("sermon"),
  default_language: z.string().max(20).optional(),
  word_target: z.number().int().min(100).max(50_000).optional(),
});

export const settingsNotificationsSchema = z.object({
  section: z.literal("notifications"),
  friday_reminder: z.string().max(5).optional(),
  email_assigned: z.union([z.boolean(), z.number()]).optional(),
  weekly_digest: z.union([z.boolean(), z.number()]).optional(),
});

export const settingsAppearanceSchema = z.object({
  section: z.literal("appearance"),
  theme_mode: z.enum(["light", "dark", "system"]).optional(),
  editor_font_size: z.number().int().min(12).max(32).optional(),
});

export const settingsAccountTypeSchema = z.object({
  section: z.literal("account_type"),
  account_type: z.enum(["individual", "organization", "institution"]),
  org_name: z.string().max(200).optional(),
});

export const settingsUpdateSchema = z.discriminatedUnion("section", [
  settingsProfileSchema,
  settingsSermonSchema,
  settingsNotificationsSchema,
  settingsAppearanceSchema,
  settingsAccountTypeSchema,
]);

export const referenceSchema = z.object({
  type: z.enum(["quran", "hadith", "book", "article", "other"]),
  title: z.string().min(1, "Title is required").max(500),
  source: z.string().max(500).nullable().optional(),
  content: z.string().max(5000).nullable().optional(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { error: firstError?.message || "Invalid input" };
  }
  return { data: result.data };
}
