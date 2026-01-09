// src/routes/image-log.routes.ts

import { Elysia, t } from 'elysia';
import { ImageLogController } from '../controllers/image-log.controller';
import jwt from '@elysiajs/jwt'; 
import { config } from '../config'; 

// กำหนด JWT Plugin
const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const imageLogRoutes = new Elysia({ prefix: '/image-log' })
    .use(jwtPlugin)
    
    // Route 1: GET /image-log/dates (ดึงรายการวันที่ทั้งหมด)
    .get('/dates', async ({ set, jwt, headers, query }) => { 
        // --- 1. JWT Authentication Check ---
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
        // --- End Check ---
        const { lane } = query; // 🔴 รับค่า lane
        if (!lane) {
            set.status = 400;
            return { message: 'Lane query parameter is required.' };
        }

        // 🔴 FIX: ส่ง lane ไปให้ Controller
        const dates = await ImageLogController.getAvailableDates(lane as string); 

        return { dates }; 
    })
    
    // 🔴 Route 2: GET /image-log/images?date=YYYY-MM-DD&lane=Lane Name
    .get('/images', async ({ set, query, jwt, headers }) => { 
        // --- 1. JWT Authentication Check ---
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
        // --- End Check ---
        
        const { date, lane } = query; // 🔴 รับ lane เพิ่ม
        if (!date || !lane) { // 🔴 ตรวจสอบทั้ง date และ lane
            set.status = 400;
            return { message: 'Date and Lane query parameters are required.' };
        }
        
        try {
            // 🔴 เรียก Controller ด้วย date และ lane
            const images = await ImageLogController.getImagesByDateAndLane(date, lane);
            return images; 
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        query: t.Object({
            date: t.String(),
            lane: t.String(), // 🔴 เพิ่ม Lane ใน Schema
        }),
    })
    .get('/records', async ({ set, jwt, headers, query }) => {
        // --- JWT Check (Copy logic เดิมมาใส่) ---
        const authHeader = headers['authorization'];
        if (!authHeader) { set.status = 401; return { message: 'No Auth' }; }
        const token = authHeader.split(' ')[1];
        if (!await jwt.verify(token)) { set.status = 401; return { message: 'Invalid Token' }; }
        // ---------------------------------------

        const { lane } = query;
        // บังคับว่าถ้าไม่ส่งมา ให้ Default เป็น 'Lane_1' (ตามโจทย์ที่อยากยึด Lane 1 เป็นหลัก)
        const targetLane = (lane as string) || 'Lane_1';

        try {
            const logs = await ImageLogController.getLogRecords(targetLane);
            return logs;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        query: t.Object({
            lane: t.Optional(t.String())
        })
    });