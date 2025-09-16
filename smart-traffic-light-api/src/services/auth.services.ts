// src/services/auth.services.ts
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
     * เปรียบเทียบรหัสผ่านที่ป้อนเข้ามากับรหัสผ่านที่เข้ารหัสแล้วในฐานข้อมูล.
     * @param password รหัสผ่านที่ผู้ใช้ป้อนเข้ามา
     * @param hash รหัสผ่านที่เข้ารหัสในฐานข้อมูล
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },
};