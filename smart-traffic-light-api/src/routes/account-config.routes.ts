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
    // ✅ แก้ไข: Route สำหรับการสร้างบัญชี
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
            const newAccount = await AccountConfigController.createAccount(body);
            return {
                message: 'Account created successfully!',
                account: newAccount.account,
            };
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            username: t.String(),
            password: t.String(),
            First_Name: t.String(),
            Last_Name: t.String(),
            ID_Card: t.String(),
            Email: t.String(),
            Phone_Number: t.String(),
            Role: t.String(),
            Register_Date: t.String(),
        }),
    })
    
    // ✅ เพิ่ม: Route สำหรับการลบบัญชีผู้ใช้หลายรายการ.\r\n    .post('/delete', async ({ set, jwt, headers, body }) => {
    .post('/delete', async ({ set, jwt, headers, body }) => {
    // โค้ดสำหรับตรวจสอบ JWT และ Authorization...

    try {
        const { accountIds } = body;
        const result = await AccountConfigController.deleteAccounts(accountIds);
        return result;
    } catch (error: any) {
        set.status = 400;
        return { message: error.message };
    }
}, {
    // ✅ เพิ่ม: ตัวตรวจสอบสำหรับ request body
    body: t.Object({
        accountIds: t.Array(t.Number()),
    }),
})
    // ✅ แก้ไข: Route สำหรับการอัปเดตบัญชีผู้ใช้.
    .put('/update/:adminId', async ({ set, jwt, headers, body, params: { adminId } }) => {
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
            await AccountConfigController.updateAccount(Number(adminId), body);
            return { message: 'Account updated successfully!' };
        } catch (error: any) {
            set.status = 400;
            return { message: error.message };
        }
    }, {
        body: t.Object({
            First_Name: t.String(),
            Last_Name: t.String(),
            ID_Card: t.String(),
            Email: t.String(),
            Phone_Number: t.String(),
            Role: t.String(),
            Register_Date: t.String(),
        }),
    })
    