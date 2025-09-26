// src/services/account-config.services.ts

import sql from 'mssql';
import * as bcrypt from 'bcrypt'; 
import { getDbPool } from '../config/dev.config';

const saltRounds = 10;

/**
 * Service สำหรับจัดการข้อมูลและการตรวจสอบผู้ใช้ (Admin).
 */
export const AccountConfigService = {

    /**
     * 🔑 HELPER: ฟังก์ชันค้นหา Role_ID จาก Role Name
     */
    async getRoleIdByRoleName(roleName: string, pool: sql.ConnectionPool) {
        const request = new sql.Request(pool);
        request.input('roleName', sql.NVarChar(50), roleName);
        const result = await request.query`
            SELECT Role_ID
            FROM stl.Roles
            WHERE Role_Name = @roleName;
        `;
        if (result.recordset.length === 0) {
            throw new Error(`Role name '${roleName}' not found in stl.Roles.`);
        }
        return result.recordset[0].Role_ID;
    },

    /**
     * ดึงข้อมูลผู้ใช้ทั้งหมดจากตาราง Admin.
     */
    async getAllAccounts() {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            
            // ✅ FIX: ใช้ JOIN เพื่อดึง Role Name
            const result = await request.query`
                SELECT 
                    A.*,            
                    R.Role_Name AS Role -- คอลัมน์นี้จะถูกส่งออกในชื่อ 'Role'
                FROM 
                    stl.Admin A
                INNER JOIN 
                    stl.Roles R ON A.Role_ID = R.Role_ID 
            `;
            
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
            
            // ✅ FIX: ใช้ JOIN เพื่อดึง Role Name
            const result = await request.query`
                SELECT 
                    A.*, 
                    R.Role_Name AS Role
                FROM 
                    stl.Admin A
                INNER JOIN 
                    stl.Roles R ON A.Role_ID = R.Role_ID
                WHERE 
                    A.Admin_ID = @adminId
            `;
            
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
            const pool = await getDbPool();
            
            // 🔑 FIX 1: ค้นหา Role_ID จาก Role Name ที่รับมา
            const roleId = await this.getRoleIdByRoleName(data.Role, pool);
            
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            const request = new sql.Request(pool);

            // ... inputs เดิม ...
            request.input('username', sql.NVarChar(50), data.username);
            request.input('password', sql.NVarChar(64), hashedPassword);
            request.input('firstName', sql.NVarChar(100), data.First_Name);
            request.input('lastName', sql.NVarChar(100), data.Last_Name);
            request.input('idCard', sql.NVarChar(13), data.ID_Card);
            request.input('email', sql.NVarChar(100), data.Email);
            request.input('phoneNumber', sql.NVarChar(10), data.Phone_Number);
            request.input('registerDate', sql.Date, data.Register_Date);
            
            // 🔑 FIX 2: ใช้ Role_ID ในการ INSERT แทน Role Name
            request.input('roleId', sql.Int, roleId); 

            const result = await request.query`
                INSERT INTO stl.Admin (Username, Password, First_Name, Last_Name, ID_Card, Email, Phone_Number, Register_Date, Role_ID, Create_Date, Update_Date)
                VALUES (@username, @password, @firstName, @lastName, @idCard, @email, @phoneNumber, @registerDate, @roleId, GETDATE(), GETDATE());
                
                -- SELECT เพื่อส่งข้อมูลที่อัปเดตกลับไป
                SELECT 
                    A.*, 
                    R.Role_Name AS Role
                FROM 
                    stl.Admin A
                INNER JOIN 
                    stl.Roles R ON A.Role_ID = R.Role_ID
                WHERE 
                    A.Username = @username;
            `;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to create account in database.');
        }
    },

    async deleteAccounts(accountIds: number[]) {
        // ... (โค้ดเดิม ไม่มีการเรียกดูข้อมูล จึงไม่ต้องแก้ไข) ...
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
     * ✅ FIX: เพิ่ม password?: string ใน data type
     */
    async updateAccount(adminId: number, data: { First_Name: string, Last_Name: string, ID_Card: string, Email: string, Phone_Number: string, Role: string, Register_Date: string, password?: string }) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool); // สร้าง request ครั้งเดียว
            
            // 1. ค้นหา Role_ID จาก Role Name ที่รับมา
            const roleId = await this.getRoleIdByRoleName(data.Role, pool);
            
            // 2. จัดการ Password Input (ถ้ามีการกรอกมา)
            let passwordUpdateClause = '';
            if (data.password) {
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                // ✅ FIX: เพิ่ม input 'newHashedPassword' เข้าไปใน request เดียวกัน
                request.input('newHashedPassword', sql.NVarChar(64), hashedPassword); 
                passwordUpdateClause = `, Password = @newHashedPassword`; 
            }
            
            // 3. กำหนด Input ทั่วไปทั้งหมด
            request.input('adminId', sql.Int, adminId);
            request.input('firstName', sql.NVarChar, data.First_Name);
            request.input('lastName', sql.NVarChar, data.Last_Name);
            request.input('idCard', sql.NVarChar, data.ID_Card);
            request.input('email', sql.NVarChar, data.Email);
            request.input('phoneNumber', sql.NVarChar, data.Phone_Number);
            request.input('registerDate', sql.Date, data.Register_Date);
            request.input('roleId', sql.Int, roleId); 
            
            // 4. สร้าง Query หลักและรัน
            const updateQuery = `
                UPDATE stl.Admin
                SET
                    First_Name = @firstName,
                    Last_Name = @lastName,
                    ID_Card = @idCard,
                    Email = @email,
                    Phone_Number = @phoneNumber,
                    Role_ID = @roleId, 
                    Register_Date = @registerDate,
                    Update_Date = GETDATE()
                    ${passwordUpdateClause}  -- อัปเดต Password ถ้ามี
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
            
            // ✅ FIX: ใช้ JOIN เพื่อดึง Role Name
            const result = await request.query`
                SELECT 
                    A.*, 
                    R.Role_Name AS Role
                FROM 
                    stl.Admin A
                INNER JOIN 
                    stl.Roles R ON A.Role_ID = R.Role_ID
                WHERE 
                    A.ID_Card = @idCard
            `;
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
            
            // ✅ FIX: ใช้ JOIN เพื่อดึง Role Name
            const result = await request.query`
                SELECT 
                    A.*, 
                    R.Role_Name AS Role
                FROM 
                    stl.Admin A
                INNER JOIN 
                    stl.Roles R ON A.Role_ID = R.Role_ID
                WHERE 
                    A.Phone_Number = @phoneNumber
            `;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },
    /**
     * ฟังก์ชันสำหรับเปลี่ยนรหัสผ่านของผู้ใช้
     */
    async changePassword(adminId: number, oldPassword: string, newPassword: string) {
        // ... (โค้ดเดิม) ...
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            
            // 1. ค้นหาบัญชีผู้ใช้ด้วย Admin ID
            const user = await this.getAccountById(adminId); // getAccountById ถูกแก้ไขแล้ว
            if (!user) {
                throw new Error('User not found.');
            }

            // 2. ตรวจสอบรหัสผ่านเก่าด้วย bcrypt
            const isPasswordMatch = await bcrypt.compare(oldPassword, user.Password);
            if (!isPasswordMatch) {
                throw new Error('Password is incorrect.');
            }

            // 3. เข้ารหัสรหัสผ่านใหม่ด้วย bcrypt
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // 4. อัปเดตฐานข้อมูลด้วยรหัสผ่านใหม่
            await request.query`
                UPDATE stl.Admin
                SET Password = ${hashedNewPassword}, Update_Date = GETDATE()
                WHERE Admin_ID = ${adminId};
            `;
            
            return { success: true, message: 'Password updated successfully!' };
        } catch (err: any) {
            console.error('SQL error in changePassword:', err);
            throw new Error(err.message || 'Failed to change password.');
        }
    },
};