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
    
    // GET /image-violation/images?date=...&lane=...
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

    // GET /image-violation/records?lane=...
    .get('/records', async ({ set, jwt, headers, query }) => {
        const authHeader = headers['authorization'];
        if (!authHeader) { set.status = 401; return { message: 'No Auth' }; }
        const token = authHeader.split(' ')[1];
        if (!await jwt.verify(token)) { set.status = 401; return { message: 'Invalid Token' }; }

        const { lane } = query;
        // Default เป็น Lane_1 ถ้าไม่ส่งมา (เหมือน Traffic)
        const targetLane = (lane as string) || 'Lane_1';

        try {
            return await ImageViolationController.getLogRecords(targetLane);
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        query: t.Object({
            lane: t.Optional(t.String())
        })
    });