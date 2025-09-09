// src/services/account-config.services.ts

import sql from 'mssql';
import { sha256 } from 'js-sha256';
import { getDbPool } from '../config/dev.config';

/**
 * Service สำหรับจัดการข้อมูลและการตรวจสอบผู้ใช้ (Admin).
 */
export const AccountConfigService = {

    /**
     * ดึงข้อมูลผู้ใช้ทั้งหมดจากตาราง Admin.
     * @returns ข้อมูลผู้ใช้ทั้งหมดในรูปแบบ Array.
     */
    async getAllAccounts() {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            const result = await request.query`SELECT * FROM stl.Admin`;
            return result.recordset;
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },

    
    /**
     * สร้างผู้ใช้ใหม่ในฐานข้อมูล.
     * @param data ข้อมูลผู้ใช้ที่ใช้ในการสร้าง
     */
    async createAccount(data: { username: string, password: string, firstName: string, lastName: string, idCard: string, email: string, phoneNumber: string, role: string }) {
        try {
            const hashedPassword = sha256(data.password);
            const pool = await getDbPool();
            const request = new sql.Request(pool);

            // ✅ แก้ไข: ใช้ request.input() เพื่อกำหนดพารามิเตอร์แต่ละตัวอย่างชัดเจน
            request.input('username', sql.NVarChar, data.username);
            request.input('password', sql.NVarChar, hashedPassword);
            request.input('role', sql.NVarChar, data.role);
            request.input('firstName', sql.NVarChar, data.firstName);
            request.input('lastName', sql.NVarChar, data.lastName);
            request.input('idCard', sql.NVarChar, data.idCard);
            request.input('email', sql.NVarChar, data.email);
            request.input('phoneNumber', sql.NVarChar, data.phoneNumber);

            // ✅ สร้าง Query String โดยใช้ชื่อพารามิเตอร์ที่เรากำหนดไว้
            const createQuery = `
                INSERT INTO stl.Admin (
                    Username, Password, Role, First_Name, Last_Name, ID_Card, Email, Phone_Number, Register_Date, Create_Date, Update_Date
                ) VALUES (
                    @username, @password, @role, @firstName, @lastName, @idCard, @email, @phoneNumber, GETDATE(), GETDATE(), GETDATE()
                );
            `;
            await request.query(createQuery);

            // ✅ ส่วนนี้ยังคงใช้ template literal ได้ตามปกติ
            const result = await request.query`SELECT * FROM stl.Admin WHERE Username = ${data.username}`;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to create account in database.');
        }
    },
    /**
     * ลบบัญชีผู้ใช้จากฐานข้อมูล.
     * @param accountId ID ของบัญชีที่ต้องการลบ
     */
    async deleteAccount(accountId: number) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            await request.query`
                DELETE FROM stl.Admin WHERE Admin_ID = ${accountId};
            `;
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to delete account.');
        }
    },
    /**
     * ✅ เพิ่ม: ลบบัญชีผู้ใช้หลายรายการ.
     * @param accountIds Array ของ Admin_ID ที่ต้องการลบ.
     */
    async deleteAccounts(accountIds: number[]) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            
            // ✅ ใช้คำสั่ง IN เพื่อลบหลายรายการในครั้งเดียว
            const deleteQuery = `
                DELETE FROM Admin WHERE Admin_ID IN (${accountIds.join(',')})
            `;
            const result = await request.query(deleteQuery);
            return result.rowsAffected;
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to delete accounts from database.');
        }
    },
};