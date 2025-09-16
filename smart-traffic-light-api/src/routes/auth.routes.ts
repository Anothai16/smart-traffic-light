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

             console.log(`✅ Token for user: ${body.username} has been created with a 2 hours expiration.`);

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
    // .post('/sign-up', async ({ body, jwt, set }) => {
    //     try {
    //         const result = await AuthController.signUp(body);

    //         const token = await jwt.sign({
    //             userId: result.user.userId,
    //             Admin_ID: result.user.userId, // ✅ เพิ่ม Admin_ID ใน payload
    //             email: result.user.email,
    //             authority: result.user.authority,
    //         });

    //         return { user: result.user, token };
    //     } catch (error: any) {
    //         set.status = 400;
    //         return { message: error.message };
    //     }
    // })
    .get('/protected-route', async ({ set, jwt, headers }) => {
        const authHeader = headers['authorization'];
        if (!authHeader) {
            set.status = 401;
            console.log('❌ Unauthorized: Authorization header is missing.');
            return { message: 'Authorization header is missing.' };
        }

        const token = authHeader.split(' ')[1];
        try {
            const payload = await jwt.verify(token);
            if (!payload) {
                set.status = 401;
                console.log('❌ Unauthorized: Invalid or expired token.');
                return { message: 'Invalid or expired token.' };
            }
            // Logic for protected route
            return { message: 'Access granted to protected route.' };
        } catch (error) {
            set.status = 401;
            console.log('❌ Unauthorized: Token verification failed.');
            return { message: 'Token verification failed.' };
        }
    });