// --- src/server.ts ---
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from './config';
import { closeDbPool } from './config/db.config'; 
import { uploadRoutes } from './routes/upload.routes';
import { staticPlugin } from '@elysiajs/static';
import { swagger } from '@elysiajs/swagger';
import { appRoutes } from './router';
import * as path from 'path'; // ✅ Import path
import * as fs from 'fs';     // ✅ Import fs

// Helper รับ Path และแปลงเป็น Absolute Path ทันที
const getPath = (envPath: string | undefined, defaultPath: string) => {
    const raw = envPath || defaultPath;
    // ✅ แปลงเป็น Path เต็มๆ เพื่อความชัวร์ (แก้ปัญหารูปไม่ขึ้นเพราะหา folder ไม่เจอ)
    return path.resolve(raw);
};

// เตรียม Path
const trafficPath = getPath(process.env.IMAGE_ROOT_PATH, 'traffic_data_storage');
const violationPath = getPath(process.env.VIOLATION_ROOT_PATH, 'violation_data_storage');

// Log Path ออกมาดูตอนรัน
console.log('📂 Traffic Assets Path:', trafficPath);
console.log('📂 Violation Assets Path:', violationPath);

// สร้างโฟลเดอร์ไว้ก่อนถ้ายังไม่มี (กัน Error)
if (!fs.existsSync(trafficPath)) fs.mkdirSync(trafficPath, { recursive: true });
if (!fs.existsSync(violationPath)) fs.mkdirSync(violationPath, { recursive: true });

const app = new Elysia()
    .use(cors({ origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
    .use(swagger())
    
    // -----------------------------------------------------------
    // 1. ✅ Static Plugin สำหรับ "Traffic Images"
    // -----------------------------------------------------------
    .use(staticPlugin({
        assets: trafficPath,
        prefix: '/static/traffic-images' 
    }))

    // -----------------------------------------------------------
    // 2. ✅ Static Plugin สำหรับ "Violation Images"
    // -----------------------------------------------------------
    .use(staticPlugin({
        assets: violationPath,
        prefix: '/static/violation-images'
    }))

    // 3. Upload Routes
    .use(uploadRoutes)

    // 4. App Routes
    .use(appRoutes)

    // Error Handler (กรอง NOT_FOUND ไม่ให้รก Console)
    .onError(({ code, error, set }) => {
        if (code !== 'NOT_FOUND') {
            console.error('🔥 Server Error:', error); 
        }

        if (code === 'VALIDATION') {
            set.status = 400;
            return { status: 'error', message: 'Validation Error', errors: (error as any).message };
        }
        
        if (code === 'NOT_FOUND') {
            set.status = 404;
            return { status: 'error', message: 'Route or File not found' };
        }
        
        set.status = 500;
        return { status: 'error', message: 'Internal Server Error', details: (error as any).message };
    })
    
    .get('/', () => ('Welcome to the Smart Traffic Light API!'))
    .listen(config.PORT);

console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

// Graceful Shutdown
const cleanup = async (signal: string) => {
    console.info(`\n${signal} signal received. Shutting down gracefully...`);
    try {
        await closeDbPool();
        await app.stop();
        console.log('Server stopped successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));