import { Elysia, t } from 'elysia';
import { ImageViolationController } from '../controllers/image-violation.controller';
import jwt from '@elysiajs/jwt'; 
import { config } from '../config'; 

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const imageViolationRoutes = new Elysia({ prefix: '/image-violation' })
    .use(jwtPlugin)
    
    // Route สำหรับดึงรูปภาพ (ยังต้องระบุเลนเพื่อดึงรูปจากโฟลเดอร์ที่ถูกต้อง)
    .get('/images', async ({ set, query, jwt, headers }) => { 
        const authHeader = headers['authorization'];
        if (!authHeader) { set.status = 401; return { message: 'Authorization header is missing' }; }

        const token = authHeader.split(' ')[1];
        if (!await jwt.verify(token)) { set.status = 401; return { message: 'Invalid token' }; }
        
        const { date, lane } = query; 
        if (!date || !lane) {
            set.status = 400;
            return { message: 'Date and Lane query parameters are required.' };
        }
        
        try {
            return await ImageViolationController.getImagesByDateAndLane(date, lane);
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        query: t.Object({
            date: t.String(),
            lane: t.String(),
        }),
    })

    // Route สำหรับดึงรายการ Records (ปรับให้เรียกแบบรวมทุก Lane)
    .get('/records', async ({ set, jwt, headers }) => {
        const authHeader = headers['authorization'];
        if (!authHeader) { set.status = 401; return { message: 'No Auth' }; }
        const token = authHeader.split(' ')[1];
        if (!await jwt.verify(token)) { set.status = 401; return { message: 'Invalid Token' }; }

        try {
            // เรียก Controller โดยตรงโดยไม่ผ่าน Query Lane
            return await ImageViolationController.getLogRecords();
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    });