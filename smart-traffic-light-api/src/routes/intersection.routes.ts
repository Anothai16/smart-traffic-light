// src/routes/intersection.routes.ts
import { Elysia, t } from 'elysia';
import { IntersectionController } from '../controllers/intersection.controller';
import jwt from '@elysiajs/jwt';
import { config } from '../config';

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const intersectionRoutes = new Elysia({ prefix: '/master/intersection' })
    .use(jwtPlugin)
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
    .get('/', async ({ set }) => {
        try {
            return await IntersectionController.getAll();
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    })
    // Create
    .post('/', async ({ set, body }) => {
        try {
            return await IntersectionController.create(body as any);
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            Name: t.String(),
            Intersection_Number: t.Number(),
            IP_Address: t.String(),
            Location: t.String(),
            Lane_Sequence: t.Number() // 🟢 เพิ่มบรรทัดนี้เพื่อให้ Route ยอมรับข้อมูล
        })
    })
    // Update
    .put('/:id', async ({ set, params, body }) => {
        try {
            return await IntersectionController.update(Number(params.id), body as any);
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            Name: t.String(),
            Intersection_Number: t.Number(),
            IP_Address: t.String(),
            Location: t.String(),
            Lane_Sequence: t.Number() // 🟢 เพิ่มบรรทัดนี้เพื่อให้ Route ยอมรับข้อมูล
        })
    })
    .delete('/:id', async ({ set, params }) => {
        try {
            return await IntersectionController.delete(Number(params.id));
        } catch (error: any) {
            set.status = 500;
            return { message: error.message };
        }
    });