// src/services/traffic.service.ts
import { getDbPool } from '../config/db.config';
import { RowDataPacket } from 'mysql2';

interface TrafficMode {
    Mode_ID: number;
    Mode_Name: string;
}

interface IntersectionQueryResult {
    Intersection_ID: number;
    Name: string;
    New_Red_Duration: number;
    New_Green_Duration: number;
}

interface UpdateIntersectionData {
    Intersection_ID: number;
    New_Red_Duration: number;
    New_Green_Duration: number;
}

export const TrafficService = {
    async getModes(): Promise<TrafficMode[]> {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.query('SELECT * FROM Traffic_Mode');
            return rows as TrafficMode[];
        } catch (err) {
            console.error('SQL error in getModes:', err);
            throw new Error('Failed to retrieve traffic modes.');
        }
    },

    async getIntersections(): Promise<IntersectionQueryResult[]> {
        try {
            const pool = await getDbPool();
            const [rows] = await pool.query(`
                SELECT T1.Intersection_ID, T2.Name, T1.New_Red_Duration, T1.New_Green_Duration
                FROM Auto_Config_Log AS T1
                JOIN Master_Intersection AS T2 ON T1.Intersection_ID = T2.Intersection_ID
                WHERE T1.Create_Date IN (
                    SELECT MAX(Create_Date)
                    FROM Auto_Config_Log
                    GROUP BY Intersection_ID
                )
            `);
            return rows as IntersectionQueryResult[];
        } catch (err) {
            console.error('SQL error in getIntersections:', err);
            throw new Error('Failed to retrieve intersection data.');
        }
    },

    async updateIntersections(data: UpdateIntersectionData[], adminId: number): Promise<void> {
        const pool = await getDbPool();
        const connection = await pool.getConnection(); // Transaction ต้องใช้ connection เดียว
        try {
            await connection.beginTransaction();

            const [modeRows] = await connection.execute<RowDataPacket[]>(`
                SELECT Mode_ID FROM Traffic_Mode WHERE Mode_Name = 'Auto'
            `);
            const autoModeID = modeRows[0]?.Mode_ID;

            for (const item of data) {
                // MySQL: ใช้ LIMIT 1 แทน TOP 1
                const [oldValRows] = await connection.execute<RowDataPacket[]>(`
                    SELECT New_Red_Duration, New_Yellow_Duration, New_Green_Duration
                    FROM Auto_Config_Log
                    WHERE Intersection_ID = ?
                    ORDER BY Create_Date DESC LIMIT 1
                `, [item.Intersection_ID]);
                
                const oldValues = oldValRows[0] || { 
                    New_Red_Duration: null, 
                    New_Yellow_Duration: null, 
                    New_Green_Duration: null 
                };

                await connection.execute(`
                    INSERT INTO Auto_Config_Log 
                    (Mode_ID, Admin_ID, Intersection_ID, Time, Date, Old_Red_Duration, Old_Yellow_Duration, Old_Green_Duration, New_Red_Duration, New_Yellow_Duration, New_Green_Duration, Create_Date, Update_Date)
                    VALUES
                    (?, ?, ?, CURTIME(), CURDATE(), ?, ?, ?, ?, 3, ?, NOW(), NOW())
                `, [
                    autoModeID, adminId, item.Intersection_ID,
                    oldValues.New_Red_Duration, oldValues.New_Yellow_Duration, oldValues.New_Green_Duration,
                    item.New_Red_Duration, item.New_Green_Duration
                ]);
            }

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            console.error('SQL transaction error:', err);
            throw new Error('Failed to update intersection times.');
        } finally {
            connection.release();
        }
    },

    async updateTrafficMode(modeName: string, adminId: number): Promise<void> {
        try {
            const pool = await getDbPool();
            const [modeRows] = await pool.execute<RowDataPacket[]>(
                'SELECT Mode_ID FROM Traffic_Mode WHERE Mode_Name = ?', 
                [modeName]
            );
            
            if (modeRows.length === 0) {
                throw new Error('Invalid mode name provided.');
            }
            const modeID = modeRows[0].Mode_ID;

            // ✅ แก้ไขส่วนนี้: สร้างเวลาปัจจุบันให้ตรงกับเวลาไทย (GMT+7)
            // เพื่อให้เวลาจากการกดหน้าเว็บ เท่ากับเวลาที่กดจากปุ่ม Hardware
            const now = new Date();
            const offset = 7 * 60 * 60 * 1000; // GMT+7
            const localNow = new Date(now.getTime() + offset);
            
            const dateStr = localNow.toISOString().split('T')[0]; 
            const timeStr = localNow.toISOString().split('T')[1].split('.')[0];
            const fullDateTime = localNow.toISOString().slice(0, 19).replace('T', ' ');

            await pool.execute(`
                INSERT INTO Mode_Log (Mode_ID, Admin_ID, Time, Date, Create_Date, Update_Date)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [modeID, adminId, timeStr, dateStr, fullDateTime, fullDateTime]);
            
        } catch (err) {
            console.error('SQL error in updateTrafficMode:', err);
            throw new Error('Failed to update traffic mode.');
        }
    },

    async getCurrentModeStatus(): Promise<string | null> {
        try {
            const pool = await getDbPool();
            // ✅ ใช้การเรียงลำดับที่ละเอียดขึ้นเพื่อให้ได้ข้อมูลล่าสุดจริงๆ
            const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT tm.Mode_Name
                FROM Mode_Log ml
                JOIN Traffic_Mode tm ON ml.Mode_ID = tm.Mode_ID
                ORDER BY ml.Create_Date DESC, ml.Log_ID DESC 
                LIMIT 1
            `);

            if (rows.length > 0) {
                return rows[0].Mode_Name;
            }
            return null; 
        } catch (err) {
            console.error('SQL error in getCurrentModeStatus:', err);
            return null;
        }
    },
};