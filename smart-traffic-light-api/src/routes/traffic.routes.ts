// src/routes/traffic.routes.ts

import { Elysia, t } from 'elysia';
import { TrafficController } from '../controllers/traffic.controller';
import jwt from '@elysiajs/jwt';
import { config } from '../config';
import { io } from '../socket-server';

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const trafficRoutes = new Elysia({ prefix: '/traffic' })
    .use(jwtPlugin)
    .get('/modes', async ({ set, jwt, headers }) => {
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
            const result = await TrafficController.getModes();
            return result;
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    })
    .get('/intersections', async ({ set, jwt, headers }) => {
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
            const result = await TrafficController.getIntersections();
            return result;
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    })
    .get('/status', async ({ set, jwt, headers }) => {
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
            const result = await TrafficController.getCurrentModeStatus();
            return result;
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    })
    .post(
        '/mode',
        async ({ set, jwt, headers, body }) => {
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
                const adminId = payload.Admin_ID;
                if (typeof adminId !== 'number') {
                    set.status = 400;
                    return { message: 'Invalid Admin_ID in token payload.' };
                }
                const result = await TrafficController.updateTrafficMode(body, adminId);
                return result;
            } catch (error: any) {
                set.status = 400;
                return { message: error.message };
            }
        },
        {
            body: t.Object({
                modeName: t.String(),
            }),
        }
    )
    .post(
        '/update-intersections',
        async ({ set, jwt, headers, body }) => {
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
                const adminId = payload.Admin_ID;
                if (typeof adminId !== 'number') {
                    set.status = 400;
                    return { message: 'Invalid Admin_ID in token payload.' };
                }
                const result = await TrafficController.updateIntersections(body, adminId);
                return result;
            } catch (error: any) {
                set.status = 400;   
                return { message: error.message };
            }
        },
        {
            body: t.Object({
                intersections: t.Array(
                    t.Object({
                        Intersection_ID: t.Number(),
                        New_Red_Duration: t.Number(),
                        New_Green_Duration: t.Number(),
                    })
                ),
            }),
        }
    );