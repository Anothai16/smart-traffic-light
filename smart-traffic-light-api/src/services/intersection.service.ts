// src/services/intersection.service.ts
import { getDbPool } from '../config/db.config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Intersection {
    Intersection_ID?: number;
    Name: string;
    Intersection_Number: number;
    IP_Address: string;
    Location: string;
}

export const IntersectionService = {
    // ดึงข้อมูลทั้งหมด
    async getAll(): Promise<Intersection[]> {
        const pool = await getDbPool();
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM Master_Intersection ORDER BY Intersection_ID ASC');
        return rows as Intersection[];
    },

    // ดึงข้อมูลตาม ID
    async getById(id: number): Promise<Intersection | null> {
        const pool = await getDbPool();
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM Master_Intersection WHERE Intersection_ID = ?', 
            [id]
        );
        return (rows[0] as Intersection) || null;
    },

    // สร้างข้อมูลใหม่
    async create(data: Intersection): Promise<number> {
        const pool = await getDbPool();
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO Master_Intersection (Name, Intersection_Number, IP_Address, Location, Create_Date, Update_Date)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [data.Name, data.Intersection_Number, data.IP_Address, data.Location]
        );
        return result.insertId;
    },

    // แก้ไขข้อมูล (Update)
    async update(id: number, data: Intersection): Promise<void> {
        const pool = await getDbPool();
        await pool.execute(
            `UPDATE Master_Intersection 
             SET Name = ?, Intersection_Number = ?, IP_Address = ?, Location = ?, Update_Date = NOW()
             WHERE Intersection_ID = ?`,
            [data.Name, data.Intersection_Number, data.IP_Address, data.Location, id]
        );
    },

    // ลบข้อมูล
    async delete(id: number): Promise<void> {
        const pool = await getDbPool();
        await pool.execute('DELETE FROM Master_Intersection WHERE Intersection_ID = ?', [id]);
    }
};