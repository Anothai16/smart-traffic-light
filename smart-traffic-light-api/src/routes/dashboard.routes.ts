// src/routes/dashboard.routes.ts
import { Elysia, t } from 'elysia';
import { DashboardController } from '../controllers/dashboard.controller';
import jwt from '@elysiajs/jwt';
import { config } from '../config';

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    .use(jwtPlugin)
    // Middleware ตรวจสอบ Token (เหมือนกับ intersection.routes)
    .onBeforeHandle(async ({ set, jwt, headers }) => {
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
    })
    // Route สำหรับดึงข้อมูล Analytics
    .get('/analytics', async ({ set, query }) => {
        try {
            const { startDate, endDate } = query;
            
            // เปลี่ยนจากเช็ค date มาเป็นเช็ค startDate และ endDate
            if (!startDate || !endDate) {
                set.status = 400;
                return { message: 'startDate and endDate parameters are required' };
            }
            
            // ส่ง parameter 2 ตัวไปยัง Controller
            return await DashboardController.getAnalytics(startDate, endDate);
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        // แก้ไข Validation Schema ตรงนี้ให้ตรงกับที่ส่งมาจาก Frontend
        query: t.Object({
            startDate: t.String(),
            endDate: t.String()
        })
    });