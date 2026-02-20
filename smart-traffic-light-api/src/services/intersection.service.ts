// src/services/intersection.service.ts
import { getDbPool } from '../config/db.config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Intersection {
    Intersection_ID?: number;
    Name: string;
    Intersection_Number: number;
    IP_Address: string;
    Location: string;
    Lane_Sequence: number;
    Status?: string; // 🟢 ใช้คอลัมน์ Status
}

export const IntersectionService = {
    // 1. ดึงข้อมูล (พร้อม Logic ตัด Offline อัตโนมัติ โดยดูจาก Update_Date)
    async getAll(): Promise<Intersection[]> {
        const pool = await getDbPool();

        // ✅ AUTO-CHECK: ถ้า Update_Date เก่ากว่า 30 วินาที และสถานะเป็น Online -> ปรับเป็น Offline
        // (เราใช้ Update_Date เป็นตัวบอกเวลาล่าสุดที่ติดต่อเข้ามา)
        try {
            await pool.execute(
                `UPDATE Master_Intersection 
                 SET Status = 'Offline' 
                 WHERE Update_Date < DATE_SUB(NOW(), INTERVAL 3 SECOND) 
                 AND Status = 'Online'` 
            );
        } catch (error) {
            console.error("Error updating offline status:", error);
        }

        // ✅ ดึงข้อมูลล่าสุด
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT * FROM Master_Intersection 
            ORDER BY Intersection_ID ASC
        `);
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
            `INSERT INTO Master_Intersection (Name, Intersection_Number, IP_Address, Location, Lane_Sequence, Status, Create_Date, Update_Date)
             VALUES (?, ?, ?, ?, ?, 'Offline', NOW(), NOW())`, 
            [data.Name, data.Intersection_Number, data.IP_Address, data.Location, data.Lane_Sequence ?? null]
        );
        return result.insertId;
    },

    // แก้ไขข้อมูล (Update)
    async update(id: number, data: Intersection): Promise<void> {
        const pool = await getDbPool();
        await pool.execute(
            `UPDATE Master_Intersection 
             SET Name = ?, Intersection_Number = ?, IP_Address = ?, Location = ?, Lane_Sequence = ?, Update_Date = NOW()
             WHERE Intersection_ID = ?`, 
            [data.Name, data.Intersection_Number, data.IP_Address, data.Location, data.Lane_Sequence ?? null, id]
        );
    },

    // ลบข้อมูล
    async delete(id: number): Promise<void> {
        const pool = await getDbPool();
        await pool.execute('DELETE FROM Master_Intersection WHERE Intersection_ID = ?', [id]);
    },

    // 🟢 2. รับ Heartbeat จาก Python
    async updateHeartbeat(id: number): Promise<void> {
        const pool = await getDbPool();
        // ทันทีที่กล้องส่งมา เรา Update เป็น Online และต่ออายุ Update_Date ทันที
        await pool.execute(
            `UPDATE Master_Intersection 
             SET Status = 'Online', Update_Date = NOW() 
             WHERE Intersection_ID = ?`, 
            [id]
        );
    }
};