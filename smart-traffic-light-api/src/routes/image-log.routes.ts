// src/routes/image-log.routes.ts

import { Elysia, t } from 'elysia';
import { ImageLogController } from '../controllers/image-log.controller';
import jwt from '@elysiajs/jwt'; 
import { config } from '../config'; 

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const imageLogRoutes = new Elysia({ prefix: '/image-log' })
    .use(jwtPlugin)
    .get('/images', async ({ set, query, jwt, headers }) => { 
        const authHeader = headers['authorization'];
        if (!authHeader) { set.status = 401; return { message: 'Authorization header is missing' }; }
        const token = authHeader.split(' ')[1];
        const payload = await jwt.verify(token);
        if (!payload) { set.status = 401; return { message: 'Invalid or expired token' }; }
        
        const { date, lane } = query; 
        if (!date || !lane) {
            set.status = 400;
            return { message: 'Date and Lane query parameters are required.' };
        }
        
        try {
            const images = await ImageLogController.getImagesByDateAndLane(date, lane);
            return images; 
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
    .get('/records', async ({ set, jwt, headers, query }) => {
        const authHeader = headers['authorization'];
        if (!authHeader) { set.status = 401; return { message: 'No Auth' }; }
        const token = authHeader.split(' ')[1];
        if (!await jwt.verify(token)) { set.status = 401; return { message: 'Invalid Token' }; }

        const { lane } = query;
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
    })
    // ✅ เพิ่ม Route Delete
    .delete('/delete', async ({ body, set, jwt, headers }) => {
        // Auth Check
        const authHeader = headers['authorization'];
        if (!authHeader) { set.status = 401; return { message: 'No Auth' }; }
        const token = authHeader.split(' ')[1];
        if (!await jwt.verify(token)) { set.status = 401; return { message: 'Invalid Token' }; }

        try {
            const { filename, lane } = body as any;
            if (!filename || !lane) {
                set.status = 400;
                return { message: 'Filename and Lane are required' };
            }
            
            return await ImageLogController.deleteLog({ filename, lane });
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            filename: t.String(),
            lane: t.String()
        })
    });