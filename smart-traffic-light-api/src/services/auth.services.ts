// src/services/auth.services.ts
import { getDbPool } from '../config/db.config';
import * as bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2';

export const AuthService = {
    async findByUsername(username: string) {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.execute<RowDataPacket[]>(`
                SELECT * FROM Admin WHERE Username = ?
            `, [username]);

            return rows[0] || null;
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },

    async findByEmail(email: string) {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.execute<RowDataPacket[]>(`
                SELECT * FROM Admin WHERE Email = ?
            `, [email]);

            return rows[0] || null;
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },
};