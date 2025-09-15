// src/services/account-config.services.ts

import sql from 'mssql';
import { sha256 } from 'js-sha256'; // <--- อันนี้จะไม่ได้ใช้แล้ว
import * as bcrypt from 'bcrypt'; // <--- เพิ่มไลบรารี bcrypt
import { getDbPool } from '../config/dev.config';

// กำหนดค่า Salt Rounds สำหรับ Bcrypt
const saltRounds = 10;

/**
 * Service สำหรับจัดการข้อมูลและการตรวจสอบผู้ใช้ (Admin).
 */
export const AccountConfigService = {

    /**
     * ดึงข้อมูลผู้ใช้ทั้งหมดจากตาราง Admin.
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
     * ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ตาม Admin_ID
     */
    async getAccountById(adminId: number) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            request.input('adminId', sql.Int, adminId);
            const result = await request.query`SELECT * FROM stl.Admin WHERE Admin_ID = @adminId`;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to retrieve account details.');
        }
    },
    
    /**
     * สร้างผู้ใช้ใหม่ในฐานข้อมูล.
     */
    async createAccount(data: { username: string, password: string, First_Name: string, Last_Name: string, ID_Card: string, Email: string, Phone_Number: string, Role: string, Register_Date: string }) {
        try {
            // เข้ารหัสรหัสผ่านด้วย Bcrypt
            const hashedPassword = await bcrypt.hash(data.password, saltRounds); // <-- เปลี่ยนตรงนี้
            
            const pool = await getDbPool();
            const request = new sql.Request(pool);

            request.input('username', sql.NVarChar(50), data.username);
            request.input('password', sql.NVarChar(64), hashedPassword); // <-- เปลี่ยนตรงนี้
            request.input('firstName', sql.NVarChar(100), data.First_Name);
            request.input('lastName', sql.NVarChar(100), data.Last_Name);
            request.input('idCard', sql.NVarChar(13), data.ID_Card);
            request.input('email', sql.NVarChar(100), data.Email);
            request.input('phoneNumber', sql.NVarChar(10), data.Phone_Number);
            request.input('role', sql.NVarChar(50), data.Role);
            request.input('registerDate', sql.Date, data.Register_Date);

            const result = await request.query`
                INSERT INTO stl.Admin (Username, Password, First_Name, Last_Name, ID_Card, Email, Phone_Number, Register_Date, Role)
                VALUES (@username, @password, @firstName, @lastName, @idCard, @email, @phoneNumber, @registerDate, @role);
                SELECT * FROM stl.Admin WHERE Username = @username;
            `;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to create account in database.');
        }
    },

    async deleteAccounts(accountIds: number[]) {
        try {
            const pool = await getDbPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            const request = new sql.Request(transaction);

            const placeholders = accountIds.map((_, index) => `@id${index}`).join(', ');

            const deleteQuery = `
                DELETE FROM stl.Admin
                WHERE Admin_ID IN (${placeholders});
            `;

            accountIds.forEach((id, index) => {
                request.input(`id${index}`, sql.Int, id);
            });

            const result = await request.query(deleteQuery);
            await transaction.commit();

            return result.rowsAffected;
        } catch (err: any) {
            console.error('SQL error:', err);
            throw new Error(err.originalError?.message || 'Failed to delete account in database.');
        }
    },
    
    /**
     * อัปเดตข้อมูลบัญชีผู้ใช้ในฐานข้อมูล.
     */
    async updateAccount(adminId: number, data: { First_Name: string, Last_Name: string, ID_Card: string, Email: string, Phone_Number: string, Role: string, Register_Date: string }) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            
            request.input('adminId', sql.Int, adminId);
            request.input('firstName', sql.NVarChar, data.First_Name);
            request.input('lastName', sql.NVarChar, data.Last_Name);
            request.input('idCard', sql.NVarChar, data.ID_Card);
            request.input('email', sql.NVarChar, data.Email);
            request.input('phoneNumber', sql.NVarChar, data.Phone_Number);
            request.input('role', sql.NVarChar, data.Role);
            request.input('registerDate', sql.Date, data.Register_Date);
            
            const updateQuery = `
                UPDATE stl.Admin
                SET
                    First_Name = @firstName,
                    Last_Name = @lastName,
                    ID_Card = @idCard,
                    Email = @email,
                    Phone_Number = @phoneNumber,
                    Role = @role,
                    Register_Date = @registerDate,
                    Update_Date = GETDATE()
                WHERE Admin_ID = @adminId;
            `;
            await request.query(updateQuery);
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to update account.');
        }
    },
    
    /**
     * ฟังก์ชันสำหรับค้นหาบัญชีจาก ID_Card
     */
    async findByIDCard(idCard: string) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            request.input('idCard', sql.NVarChar(13), idCard);
            const result = await request.query`SELECT * FROM stl.Admin WHERE ID_Card = @idCard`;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },
    
    /**
     * ฟังก์ชันสำหรับค้นหาบัญชีจาก Phone_Number
     */
    async findByPhoneNumber(phoneNumber: string) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            request.input('phoneNumber', sql.NVarChar(10), phoneNumber);
            const result = await request.query`SELECT * FROM stl.Admin WHERE Phone_Number = @phoneNumber`;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },
};