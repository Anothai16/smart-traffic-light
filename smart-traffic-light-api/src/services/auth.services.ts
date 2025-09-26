// src/services/auth.services.ts (โค้ดที่แก้ไขแล้ว)
import sql from 'mssql';
import { getDbPool } from '../config/dev.config';
import * as bcrypt from 'bcrypt';

/**
 * Service สำหรับจัดการข้อมูลและการตรวจสอบผู้ใช้ (Admin).
 */
export const AuthService = {
    async findByUsername(username: string) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            // *** FIX: เพิ่ม JOIN เพื่อดึง Role_Name และตั้งชื่อเป็น Role ***
            const result = await request.query`
                SELECT 
                    A.*,
                    R.Role_Name AS Role 
                FROM stl.Admin A
                JOIN stl.Roles R ON A.Role_ID = R.Role_ID
                WHERE A.Username = ${username}
            `;
            // ************************************************************
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },
    /**
     * ค้นหาผู้ใช้ (Admin) ด้วยอีเมล.
     */
    async findByEmail(email: string) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            // *** FIX: เพิ่ม JOIN เพื่อดึง Role_Name และตั้งชื่อเป็น Role ***
            const result = await request.query`
                SELECT 
                    A.*,
                    R.Role_Name AS Role 
                FROM stl.Admin A
                JOIN stl.Roles R ON A.Role_ID = R.Role_ID
                WHERE A.Email = ${email}
            `;
            // ************************************************************
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },
    /**
     * เปรียบเทียบรหัสผ่านที่ป้อนเข้ามากับรหัสผ่านที่เข้ารหัสแล้วในฐานข้อมูล.
     * ...
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },
};