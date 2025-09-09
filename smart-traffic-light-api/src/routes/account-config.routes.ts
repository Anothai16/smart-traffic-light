// src/routes/account-config.routes.ts

import { Elysia, t } from 'elysia';
import { AccountConfigController } from '../controllers/account-config.controller';
import jwt from '@elysiajs/jwt';
import { config } from '../config';

const jwtPlugin = jwt({
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    exp: '2h',
});

export const accountConfigRoutes = new Elysia({ prefix: '/account-config' })
    .use(jwtPlugin)
    .post('/list', async ({ set, jwt, headers }) => {
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

        const accounts = await AccountConfigController.getAllAccounts();
        return { accounts };
    })
    // ✅ เพิ่ม route สำหรับการสร้างบัญชี
    .post('/create', async ({ set, jwt, headers, body }) => {
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
            const result = await AccountConfigController.createAccount(body);
            return result;
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            username: t.String(),
            password: t.String(),
            firstName: t.String(),
            lastName: t.String(),
            idCard: t.String(),
            email: t.String(),
            phoneNumber: t.String(),
            role: t.String(),
            birthday: t.String(), // ✅ เพิ่มฟิลด์ Birthday
            registerDate: t.String(), // ✅ เพิ่มฟิลด์ RegisterDate
        }),
    })
    .delete('/delete', async ({ set, jwt, headers, body }) => {
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
            const { accountId } = body as { accountId: number };
            await AccountConfigController.deleteAccount(accountId);
            return { message: 'Account deleted successfully' };
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            accountId: t.Number(),
        }),
    })
    /**
     * ✅ เพิ่ม: Route สำหรับการลบบัญชีผู้ใช้หลายรายการ.
     */
    .post('/delete', async ({ set, jwt, headers, body }) => {
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
            const { accountIds } = body;
            const result = await AccountConfigController.deleteAccounts(accountIds);
            return result;
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            accountIds: t.Array(t.Number()),
        }),
    });