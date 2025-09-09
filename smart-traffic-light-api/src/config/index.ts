import { z } from 'zod'; // ใช้ Zod สำหรับ validation (optional)

// Define a schema for environment variables (optional but recommended)
const envSchema = z.object({
  PORT: z.coerce.number().default(8091), // แปลงเป็น number และมีค่า default
  JWT_SECRET: z.string().min(1), // ต้องมีค่า ห้ามว่างเปล่า
  JWT_EXPIRES_IN: z.string().default('1h'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  // AI Service Configuration
  AI_SERVICE_URL: z.string().default('http://localhost:8095'),
});

console.log('🔍 Loading environment variables...');

// Load and validate environment variables using Bun.env
const parsedEnv = envSchema.safeParse(Bun.env);


if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  );
  // throw new Error('Invalid environment variables.'); // ใน production อาจจะ throw error
  process.exit(1); // หรือ exit process
}

// Export the validated config object
export const config = parsedEnv.data;

console.log('✅ Configuration loaded successfully.');