import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  API_GATEWAY_PORT: z.coerce.number().default(4000),
  SCRIBE_SERVICE_PORT: z.coerce.number().default(4001),
  GEMINI_SERVICE_PORT: z.coerce.number().default(4002),
  FHIR_FORMATTER_SERVICE_PORT: z.coerce.number().default(4003),
  
  SCRIBE_SERVICE_URL: z.string().url().default('http://localhost:4001'),
  GEMINI_SERVICE_URL: z.string().url().default('http://localhost:4002'),
  FHIR_FORMATTER_SERVICE_URL: z.string().url().default('http://localhost:4003'),
  
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('fhir-exports'),
  
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-3.7-flash'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function loadConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten();
    throw new Error(`Environment validation failed:\n${JSON.stringify(formatted.fieldErrors, null, 2)}`);
  }
  cachedConfig = result.data;
  return cachedConfig;
}

// For partial configs (services that don't need all vars)
export function loadPartialConfig<K extends keyof EnvConfig>(keys: K[]): Pick<EnvConfig, K> {
  const full = loadConfig();
  const partial = {} as Pick<EnvConfig, K>;
  for (const key of keys) {
    partial[key] = full[key];
  }
  return partial;
}
