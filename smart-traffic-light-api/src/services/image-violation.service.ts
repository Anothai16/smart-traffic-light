// src/services/image-violation.service.ts
 
import * as fs from 'fs';
import * as path from 'path';
import { getDbPool } from '../config/db.config'; // ✅ ใช้การเชื่อมต่อ Database
import { RowDataPacket } from 'mysql2';
 
// 1. ชี้ไปที่โฟลเดอร์ Violation
const IMAGE_ROOT_PATH = process.env.VIOLATION_ROOT_PATH || 'violation_data_storage';
// 2. Prefix URL ของ Violation
const STATIC_PREFIX = process.env.STATIC_PREFIX_VIOLATION || '/static/violation-images';
// (ถ้ามี BACKEND_BASE_URL ให้ดึงมาใช้เหมือนของ traffic เพื่อความสมบูรณ์ของ URL)
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:3000';
 
// 3. Config ให้ตรงกับ Folder จริง
const LANE_CONFIG: { [laneName: string]: string } = {
    'Lane_1': path.join(IMAGE_ROOT_PATH, 'Lane_1'),
    'Lane_2': path.join(IMAGE_ROOT_PATH, 'Lane_2'),
    'Lane_3': path.join(IMAGE_ROOT_PATH, 'Lane_3'),
    'Lane_4': path.join(IMAGE_ROOT_PATH, 'Lane_4'),
};
 
export interface ImageViolationObject {
    id: string;
    url: string;
    title: string;
    timestamp: string;
    lane: string;
}
 
export interface ViolationLogRecord {
    key: string;
    date: string;
    time: string;
    lanes?: string;
}
 
export const ImageViolationService = {
    // -------------------------------------------------------------------------
    // 🟢 [Main Function] ดึงข้อมูลจาก "ทุก Lane" หรือระบุเลน ผ่าน Database
    // -------------------------------------------------------------------------
    getLogRecordsFromFiles: async (requestedLane?: string): Promise<ViolationLogRecord[]> => {
        try {
            const pool = await getDbPool();
 
            // ดึงเฉพาะแถวที่มี Violation_Picture_Path
            let query = `
                SELECT
                    Violation_Picture_Path,
                    DATE_FORMAT(Date, '%Y-%m-%d') as DateStr,
                    Time,
                    m.Name as IntersectionName
                FROM Traffic_Log t
                LEFT JOIN Master_Intersection m ON t.Intersection_ID = m.Intersection_ID
                WHERE t.Violation_Picture_Path IS NOT NULL
            `;
           
            const queryParams: any[] = [];
 
            if (requestedLane) {
                query += ` AND t.Violation_Picture_Path LIKE ? `;
                queryParams.push(`%${requestedLane}%`);
            }
 
            query += ` GROUP BY DateStr, Time, Violation_Picture_Path, m.Name ORDER BY Date DESC, Time DESC`;
           
            const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);
 
            const records: ViolationLogRecord[] = rows.map((row) => ({
                key: row.Violation_Picture_Path,
                date: row.DateStr,
                time: row.Time,
                // แมปชื่อเลน ถ้ามีข้อมูลจากตารางมาให้ใช้ ถ้าไม่มีพยายามแกะจากชื่อไฟล์
                lanes: row.IntersectionName || extractLaneFromName(row.Violation_Picture_Path)
            }));
 
            return records;
        } catch (error) {
            console.error('❌ Error fetching violation logs from database:', error);
            return [];
        }
    },
 
    // -------------------------------------------------------------------------
    // 🟢 ฟังก์ชันดึงรูปภาพ
    // -------------------------------------------------------------------------
    async getImagesByDateAndLane(date: string, laneName: string): Promise<ImageViolationObject[]> {
        try {
            const pool = await getDbPool();
 
            // ดึงภาพจาก Database โดยเช็ควันที่และเลนจาก Violation_Picture_Path
            const query = `
                SELECT
                    t.Violation_Picture_Path,
                    DATE_FORMAT(t.Date, '%Y-%m-%d') as DateStr,
                    t.Time,
                    m.Name as IntersectionName
                FROM Traffic_Log t
                LEFT JOIN Master_Intersection m ON t.Intersection_ID = m.Intersection_ID
                WHERE t.Date = ?
                  AND t.Violation_Picture_Path IS NOT NULL
                  AND t.Violation_Picture_Path LIKE ?
                ORDER BY t.Time DESC
            `;
           
            const [rows] = await pool.query<RowDataPacket[]>(query, [date, `%${laneName}%`]);
 
            const allImages: ImageViolationObject[] = rows.map((row) => {
                const fileName = row.Violation_Picture_Path;
                // สร้าง URL จากชื่อไฟล์และข้อมูลเลน (เหมือนฝั่ง Traffic ปกติ)
                const imageUrl = `${BACKEND_BASE_URL}${STATIC_PREFIX}/${laneName}/${date}/${encodeURIComponent(fileName)}`;
 
                return {
                    id: `${date}-${laneName}-${fileName}`,
                    url: imageUrl,
                    title: fileName,
                    timestamp: `${row.DateStr} ${row.Time}`,
                    lane: row.IntersectionName || laneName,
                };
            });
 
            return allImages;
        } catch (error) {
            console.error('❌ Error fetching violation images from database:', error);
            return [];
        }
    },
 
    // 🟢 เพิ่มฟังก์ชันลบรูปภาพ สำหรับฝั่ง Violation ด้วย (เหมือนของ traffic)
    deleteLogRecord: async (filename: string, laneName: string) => {
        const lanePath = LANE_CONFIG[laneName];
        if (!lanePath) throw new Error('Invalid Lane configuration');
 
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})_/);
        if (!match) throw new Error('Invalid Filename Format');
       
        const dateFolder = match[1];
        const fullFilePath = path.join(lanePath, dateFolder, filename);
 
        console.log(`🗑️ Attempting to delete violation image: ${fullFilePath}`);
 
        if (fs.existsSync(fullFilePath)) {
            fs.unlinkSync(fullFilePath);
           
            // อัปเดตฐานข้อมูลให้ Violation_Picture_Path กลับเป็น NULL
            try {
                const pool = await getDbPool();
                await pool.query(
                    `UPDATE Traffic_Log SET Violation_Picture_Path = NULL WHERE Violation_Picture_Path = ?`,
                    [filename]
                );
            } catch (dbError) {
                console.error('❌ Failed to clear Violation_Picture_Path in database:', dbError);
            }
 
            return { success: true, message: 'File deleted successfully' };
        } else {
            console.warn(`File not found: ${fullFilePath}`);
            throw new Error('File not found on server');
        }
    }
};
 
// Helper function เพื่อดึงชื่อ Lane จากชื่อไฟล์เผื่อฉุกเฉิน (กรณีไม่ได้ JOIN มา)
function extractLaneFromName(filename: string): string {
    const match = filename.match(/Lane_\d/);
    return match ? match[0] : 'Unknown';
}