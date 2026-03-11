// src/routes/system.routes.ts
import { Elysia } from 'elysia';
import { SystemController } from '../controllers/system.controller';

// ตั้งค่า prefix เป็น /system (URL จะเป็น /system/start-video)
export const systemRoutes = new Elysia({ prefix: '/system' })
    .post('/start-video', async ({ set }) => {
        try {
            return await SystemController.startVideo();
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    })
    .post('/stop-video', async ({ set }) => {
        try {
            return await SystemController.stopVideo();
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    })
    .post('/start-pi4', async ({ set }) => {
        try {
            return await SystemController.startPiController();
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    })
    .post('/stop-pi4', async ({ set }) => {
        try {
            return await SystemController.stopPiController();
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    })
    .post('/reset', async ({ set }) => {
        try {
            return await SystemController.resetSystem();
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    });