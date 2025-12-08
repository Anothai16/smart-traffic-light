// --- src/server.ts (Updated) ---
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from './config';
import { closeDbPool } from './config/dev.config'; 

import { swagger } from '@elysiajs/swagger';
// import { io } from './socket-server';
import { appRoutes } from './router';
const app = new Elysia()
    .use(cors({ origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
    .use(swagger())
    .use(appRoutes)
    .onError((ctx: any) => {
        if ((ctx.error as any)?.code === 'VALIDATION') {
            ctx.set.status = 400;
            return { status: 'error', message: 'Validation Error', errors: ctx.error.message };
        }
        if ((ctx.error as any)?.code === 'NOT_FOUND') {
            ctx.set.status = 404;
            return { status: 'error', message: 'Route not found' };
        }
        if ((ctx.error as any)?.code === 'INTERNAL_SERVER_ERROR') {
            ctx.set.status = 500;
            return { status: 'error', message: 'Internal Server Error' };
        }
        ctx.set.status = 500;
        return { status: 'error', message: 'An unexpected error occurred' };
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

// export { io }; // ✅ Export io เพื่อให้ไฟล์อื่นสามารถนำไปใช้ได้ (ตัวอย่างเช่นใน traffic.routes.ts)