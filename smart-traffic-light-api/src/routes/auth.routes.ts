// src/routes/auth.routes.ts
import { Elysia, t } from 'elysia';
import { AuthController } from '../controllers/auth.controller';
import jwt from '@elysiajs/jwt';
import { config } from '../config';

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
    schema: t.Object({
        userId: t.Number(),
        Admin_ID: t.Number(), // ✅ เพิ่ม Admin_ID ใน schema
        email: t.String(),
        authority: t.Array(t.String())
    })
});

export const authRoutes = new Elysia({ prefix: '/auth' })
    .use(jwtPlugin)
    .post('/sign-in', async ({ body, jwt, set }) => {
        try {
            const result = await AuthController.signIn(body);

            // สร้าง Token พร้อมกับ Admin_ID
            const token = await jwt.sign({
                userId: result.user.userId,
                Admin_ID: result.user.userId, // ✅ เพิ่ม Admin_ID ใน payload
                email: result.user.email,
                authority: result.user.authority,
            });

            console.log('✅ Token has been created with a 2-hour expiration.');

            return { user: result.user, token };
        } catch (error: any) {
            set.status = 401;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })

    .post('/sign-out', () => {
        return { success: true, message: 'Signed out successfully' };
    })
    .post('/sign-up', async ({ body, jwt, set }) => {
        try {
            const result = await AuthController.signUp(body);

            const token = await jwt.sign({
                userId: result.user.userId,
                Admin_ID: result.user.userId, // ✅ เพิ่ม Admin_ID ใน payload
                email: result.user.email,
                authority: result.user.authority,
            });

            return { user: result.user, token };
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            username: t.String(),
            password: t.String(),
            email: t.String(),
        })
    });