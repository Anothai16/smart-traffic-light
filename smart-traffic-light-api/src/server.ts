// --- src/server.ts (Updated) ---
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from './config';
import { closeDbPool } from './config/db.config'; 

import { swagger } from '@elysiajs/swagger';
// import { io } from './socket-server';
import { appRoutes } from './router';
const app = new Elysia()
    .use(cors({ origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
    .use(swagger())
    .use(appRoutes)
    // 👇 แก้ส่วน onError ตามนี้ครับ
    .onError(({ code, error, set }) => {
        // 1. สั่งให้ปริ้น Error แดงๆ ออกมาดูหน่อย
        console.error('🔥 Server Error:', error); 

        if (code === 'VALIDATION') {
            set.status = 400;
            return { status: 'error', message: 'Validation Error', errors: (error as any).message };
        }
        if (code === 'NOT_FOUND') {
            set.status = 404;
            return { status: 'error', message: 'Route not found' };
        }
        
        // Default 500
        set.status = 500;
        return { status: 'error', message: 'Internal Server Error', details: (error as any).message };
    })
    // 👆 จบส่วนแก้
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

// export { io }; // ✅ Export io เพื่อให้ไฟล์อื่นสามารถนำไปใช้ได้ (ตัวอย่างเช่นใน traffic.routes.ts)