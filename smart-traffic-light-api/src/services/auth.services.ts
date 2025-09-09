// --- src/services/auth.service.ts (แก้ไขแล้ว) ---
import sql from 'mssql';
import { sha256 } from 'js-sha256';
import { getDbPool } from '../config/dev.config';

/**
 * Service สำหรับจัดการข้อมูลและการตรวจสอบผู้ใช้ (Admin).
 */
export const AuthService = {

    /**
     * ค้นหาผู้ใช้ (Admin) ด้วยชื่อผู้ใช้ (Username).
     * @param username ชื่อผู้ใช้ที่ต้องการค้นหา
     */
    async findByUsername(username: string) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            const result = await request.query`SELECT * FROM stl.Admin WHERE Username = ${username}`;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },

    /**
     * ค้นหาผู้ใช้ (Admin) ด้วยอีเมล.
     * @param email อีเมลที่ต้องการค้นหา
     */
    async findByEmail(email: string) {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            const result = await request.query`SELECT * FROM stl.Admin WHERE Email = ${email}`;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },

    /**
     * สร้างผู้ใช้ใหม่ในฐานข้อมูล.
     * @param data ข้อมูลผู้ใช้ที่ใช้ในการสร้าง
     */
    async createAdmin(data: { username: string, password: string, email: string }) {
        try {
            const hashedPassword = sha256(data.password);
            const pool = await getDbPool();
            const request = new sql.Request(pool);
            await request.query`
                INSERT INTO stl.Admin (Username, Password, Email, Role, Create_Date, Update_Date)
                VALUES (${data.username}, ${hashedPassword}, ${data.email}, 'user', GETDATE(), GETDATE());
            `;
            const result = await request.query`SELECT * FROM Admin WHERE Username = ${data.username}`;
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to create admin user.');
        }
    },

    /**
     * เข้ารหัสรหัสผ่านด้วย SHA-256.
     * @param password รหัสผ่านแบบข้อความ
     */
    hashPassword(password: string): string {
        return sha256(password); // Should be a direct hash
    },
};