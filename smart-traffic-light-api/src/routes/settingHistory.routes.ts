// src/routes/settingHistory.routes.ts
import { Elysia } from 'elysia';
import { SettingHistoryController } from '../controllers/settingHistory.controller';
import jwt from '@elysiajs/jwt';
import { config } from '../config';

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const settingHistoryRoutes = new Elysia({ prefix: '/history' })
    .use(jwtPlugin)
    .get('/setting', async ({ set, jwt, headers }) => {
        const authHeader = headers['authorization'];
        if (!authHeader) {
            set.status = 401;
            return { message: 'Authorization header is missing' };
        }
        const token = authHeader.split(' ')[1];
        const payload = await jwt.verify(token);
        if (!payload) {
            set.status = 401;
            return { message: 'Invalid or expired token' };
        }
        try {
            const result = await SettingHistoryController.getSettingModeHistory();
            return result;
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    })
    .get('/mode', async ({ set, jwt, headers }) => {
        const authHeader = headers['authorization'];
        if (!authHeader) {
            set.status = 401;
            return { message: 'Authorization header is missing' };
        }
        const token = authHeader.split(' ')[1];
        const payload = await jwt.verify(token);
        if (!payload) {
            set.status = 401;
            return { message: 'Invalid or expired token' };
        }
        try {
            const result = await SettingHistoryController.getModeHistory();
            return result;
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    });