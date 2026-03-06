// src/services/image-log.service.ts

import * as fs from 'fs';
import * as path from 'path';
import { getDbPool } from '../config/db.config'; 
import { RowDataPacket } from 'mysql2';

const IMAGE_ROOT_PATH = process.env.IMAGE_ROOT_PATH || 'traffic_data'; 
const STATIC_PREFIX = process.env.STATIC_PREFIX || '/static/traffic-images';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:3000';

const LANE_CONFIG: { [laneName: string]: string } = {
    'Lane_1': path.join(IMAGE_ROOT_PATH, 'Lane_1'),
    'Lane_2': path.join(IMAGE_ROOT_PATH, 'Lane_2'),
    'Lane_3': path.join(IMAGE_ROOT_PATH, 'Lane_3'),
    'Lane_4': path.join(IMAGE_ROOT_PATH, 'Lane_4'),
};

export interface ImageObject {
    id: string;
    url: string; 
    title: string;
    timestamp: string; 
    lane: string;
}

export interface LogRecord {
    key: string;
    date: string;
    time: string;
}

export const ImageLogService = {
    getLogRecordsFromFiles: async (laneName: string): Promise<LogRecord[]> => {
        try {
            const pool = await getDbPool(); 

            // ใช้ GROUP BY เพื่อไม่ให้เวลามันซ้ำกันในตารางแสดงผล
            const query = `
                SELECT Picture_Path, DATE_FORMAT(Date, '%Y-%m-%d') as DateStr, Time 
                FROM Traffic_Log 
                WHERE Picture_Path IS NOT NULL 
                  AND Picture_Path LIKE ? 
                GROUP BY DateStr, Time, Picture_Path
                ORDER BY Date DESC, Time DESC
            `;
            
            const [rows] = await pool.query<RowDataPacket[]>(query, [`%${laneName}%`]);

            const records: LogRecord[] = rows.map((row) => ({
                key: row.Picture_Path, 
                date: row.DateStr,
                time: row.Time
            }));

            return records;
        } catch (error) {
            console.error('❌ Error fetching log records from database:', error);
            return [];
        }
    },

    async getImagesByDateAndLane(date: string, laneName: string): Promise<ImageObject[]> {
        try {
            const pool = await getDbPool();

            // ✅ เพิ่มการ JOIN กับ Master_Intersection เพื่อดึงชื่อแยก (m.Name)
            const query = `
                SELECT 
                    t.Picture_Path, 
                    DATE_FORMAT(t.Date, '%Y-%m-%d') as DateStr, 
                    t.Time,
                    m.Name as IntersectionName
                FROM Traffic_Log t
                LEFT JOIN Master_Intersection m ON t.Intersection_ID = m.Intersection_ID
                WHERE t.Date = ? 
                  AND t.Picture_Path IS NOT NULL 
                  AND t.Picture_Path LIKE ?
                ORDER BY t.Time DESC
            `;
            
            const [rows] = await pool.query<RowDataPacket[]>(query, [date, `%${laneName}%`]);

            const allImages: ImageObject[] = rows.map((row) => {
                const fileName = row.Picture_Path;
                const imageUrl = `${BACKEND_BASE_URL}${STATIC_PREFIX}/${laneName}/${date}/${encodeURIComponent(fileName)}`;

                return {
                    id: `${date}-${laneName}-${fileName}`,
                    url: imageUrl, 
                    title: fileName,
                    timestamp: `${row.DateStr} ${row.Time}`, 
                    // ✅ ส่งชื่อภาษาไทยกลับไปให้ Frontend แสดงผลแทนคำว่า Loading...
                    lane: row.IntersectionName || laneName, 
                };
            });

            return allImages;
        } catch (error) {
            console.error('❌ Error fetching images from database:', error);
            return [];
        }
    },

    // ✅ ปรับเปลี่ยน: ให้ลบทั้ง 4 เลน และลบใน Database จาก Date + Time แทนแค่ชื่อไฟล์เดียว
    deleteLogRecord: async (filename: string, laneName: string) => {
        // คาดหวังรูปแบบชื่อไฟล์: 2026-03-05_21-44-49_Lane_1.jpg
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_/);
        if (!match) throw new Error('Invalid Filename Format');
        
        const dateFolder = match[1]; // "2026-03-05"
        const timePrefix = match[2]; // "21-44-49"

        const timeForDB = timePrefix.replace(/-/g, ':'); // แปลงกลับเป็น 21:44:49 สำหรับเช็คใน DB

        console.log(`🗑️ Attempting to delete event at Date: ${dateFolder}, Time: ${timeForDB}`);

        // 1. วนลบไฟล์จริงออกจากฮาร์ดดิสก์ ทั้ง 4 โฟลเดอร์ Lane_1 ถึง Lane_4
        Object.keys(LANE_CONFIG).forEach(laneKey => {
            const lanePath = LANE_CONFIG[laneKey];
            if (lanePath) {
                // สร้างชื่อไฟล์ตาม Pattern เช่น 2026-03-05_21-44-49_Lane_X.jpg
                const fileToDelete = `${dateFolder}_${timePrefix}_${laneKey}.jpg`;
                const fullFilePath = path.join(lanePath, dateFolder, fileToDelete);
                
                if (fs.existsSync(fullFilePath)) {
                    try {
                        fs.unlinkSync(fullFilePath);
                        console.log(`✅ Deleted file: ${fullFilePath}`);
                    } catch (err) {
                        console.error(`⚠️ Failed to delete file: ${fullFilePath}`, err);
                    }
                }
            }
        });

        // 2. เคลียร์ข้อมูลใน Database ทุก Record ที่มี Date และ Time ตรงกัน
        try {
            const pool = await getDbPool(); 
            // อัปเดต Picture_Path ให้เป็น NULL ทุกแถวที่ตรงกับเงื่อนไข
            const result = await pool.query(
                `UPDATE Traffic_Log SET Picture_Path = NULL WHERE Date = ? AND Time = ?`, 
                [dateFolder, timeForDB]
            );
            console.log(`✅ Cleared Picture_Path in database for event ${dateFolder} ${timeForDB}`);
        } catch (dbError) {
            console.error('❌ Failed to clear Picture_Path in database:', dbError);
            throw new Error('Database update failed');
        }

        return { success: true, message: 'Event (all lanes) deleted successfully' };
    }
};