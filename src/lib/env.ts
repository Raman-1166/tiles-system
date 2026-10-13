import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    TEST_DATABASE_URL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_PASSWORD_HASH: z.string().optional(),
    ADMIN_SESSION_SECRET: z
      .string()
      .min(32, "ADMIN_SESSION_SECRET must be at least 32 characters long"),
    ORDER_TOKEN_SECRET: z
      .string()
      .min(32, "ORDER_TOKEN_SECRET must be at least 32 characters long"),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    PAYMENT_PROVIDER: z.enum(["mock", "stripe"]).default("mock"),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. In production, mock payment provider is strictly forbidden
    if (data.NODE_ENV === "production" && data.PAYMENT_PROVIDER === "mock") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PAYMENT_PROVIDER"],
        message: "PAYMENT_PROVIDER cannot be 'mock' in production environment.",
      });
    }

    // 2. Either ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must exist
    if (!data.ADMIN_PASSWORD && !data.ADMIN_PASSWORD_HASH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ADMIN_PASSWORD"],
        message: "Either ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be configured.",
      });
    }

    // 3. When PAYMENT_PROVIDER is stripe, verify Stripe keys
    if (data.PAYMENT_PROVIDER === "stripe") {
      if (!data.STRIPE_SECRET_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["STRIPE_SECRET_KEY"],
          message: "STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER is 'stripe'.",
        });
      }
      if (!data.STRIPE_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["STRIPE_WEBHOOK_SECRET"],
          message: "STRIPE_WEBHOOK_SECRET is required when PAYMENT_PROVIDER is 'stripe'.",
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(customEnv?: Record<string, string | undefined>): Env {
  const source = customEnv || process.env;
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    const message = `[ENV ERROR] Invalid environment variables:\n${errorDetails}`;

    // Throw in runtime and test environments
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      console.error(message);
    }
    throw new Error(message);
  }

  return parsed.data;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!cachedEnv) {
      cachedEnv = validateEnv();
    }
    return (cachedEnv as unknown as Record<string, unknown>)[prop];
  },
});
