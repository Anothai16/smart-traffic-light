// src/services/account-config.services.ts

import { getDbPool } from '../config/db.config';
import * as bcrypt from 'bcrypt';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const saltRounds = 10;

export const AccountConfigService = {

    async getAllAccounts() {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.query(`SELECT * FROM Admin`);
            return rows;
        } catch (err) {
            console.error('SQL error:', err);
            return null; 
        }
    },
    
    async getAccountById(adminId: number) {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.execute<RowDataPacket[]>(`
                SELECT * FROM Admin WHERE Admin_ID = ?
            `, [adminId]);
            return rows[0];
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to retrieve account details.');
        }
    },
    
    async createAccount(data: { username: string, password: string, First_Name: string, Last_Name: string, ID_Card: string, Email: string, Phone_Number: string, Role: string, Register_Date: string }) {
        const pool = await getDbPool();
        const connection = await pool.getConnection();
        try {
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // แก้ไข: Insert ลงคอลัมน์ Role แทน Role_ID
            await connection.execute(`
                INSERT INTO Admin (Username, Password, First_Name, Last_Name, ID_Card, Email, Phone_Number, Register_Date, Role, Create_Date, Update_Date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [data.username, hashedPassword, data.First_Name, data.Last_Name, data.ID_Card, data.Email, data.Phone_Number, data.Register_Date, data.Role]);
            
            const [rows] = await connection.execute<RowDataPacket[]>(`
                SELECT * FROM Admin WHERE Username = ?
            `, [data.username]);

            return rows[0];
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to create account.');
        } finally {
            connection.release();
        }
    },

    async deleteAccounts(accountIds: number[]) {
        try {
            const pool = await getDbPool();
            if (accountIds.length === 0) return 0;

            const placeholders = accountIds.map(() => '?').join(',');
            const [result] = await pool.execute<ResultSetHeader>(
                `DELETE FROM Admin WHERE Admin_ID IN (${placeholders})`,
                accountIds
            );

            return result.affectedRows;
        } catch (err: any) {
            console.error('SQL error:', err);
            throw new Error('Failed to delete account.');
        }
    },
    
    async updateAccount(adminId: number, data: { First_Name: string, Last_Name: string, ID_Card: string, Email: string, Phone_Number: string, Role: string, Register_Date: string, password?: string }) {
        const pool = await getDbPool();
        const connection = await pool.getConnection();
        try {
            let passwordQuery = '';
            const params: any[] = [
                data.First_Name, data.Last_Name, data.ID_Card, data.Email, 
                data.Phone_Number, data.Role,
                data.Register_Date
            ];

            if (data.password) {
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                passwordQuery = ', Password = ?';
                params.push(hashedPassword);
            }

            params.push(adminId);

            // แก้ไข: Update คอลัมน์ Role
            const updateQuery = `
                UPDATE Admin
                SET
                    First_Name = ?, Last_Name = ?, ID_Card = ?, Email = ?,
                    Phone_Number = ?, Role = ?, Register_Date = ?,
                    Update_Date = NOW()
                    ${passwordQuery}
                WHERE Admin_ID = ?
            `;
            
            await connection.execute(updateQuery, params);
        } catch (err) {
            console.error('SQL error:', err);
            throw new Error('Failed to update account.');
        } finally {
            connection.release();
        }
    },
    
    async findByIDCard(idCard: string) {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.execute<RowDataPacket[]>(`
                SELECT * FROM Admin WHERE ID_Card = ?
            `, [idCard]);
            return rows[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },
    
    async findByPhoneNumber(phoneNumber: string) {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.execute<RowDataPacket[]>(`
                SELECT * FROM Admin WHERE Phone_Number = ?
            `, [phoneNumber]);
            return rows[0];
        } catch (err) {
            console.error('SQL error:', err);
            return null;
        }
    },

    async changePassword(adminId: number, oldPassword: string, newPassword: string) {
        try {
            const user = await this.getAccountById(adminId);
            if (!user) throw new Error('User not found.');

            const isPasswordMatch = await bcrypt.compare(oldPassword, user.Password);
            if (!isPasswordMatch) throw new Error('Password is incorrect.');

            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            const pool = await getDbPool();
            await pool.execute(
                'UPDATE Admin SET Password = ?, Update_Date = NOW() WHERE Admin_ID = ?',
                [hashedPassword, adminId]
            );
            
            return { success: true, message: 'Password updated successfully!' };
        } catch (err: any) {
            console.error('SQL error:', err);
            throw new Error(err.message || 'Failed to change password.');
        }
    }
};