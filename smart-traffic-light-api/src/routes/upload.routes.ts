import { Elysia, t } from 'elysia';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';

// ดึง Path จาก environment variable
const TRAFFIC_BASE_DIR = process.env.IMAGE_ROOT_PATH || '/traffic_data_storage';
const VIOLATION_BASE_DIR = process.env.VIOLATION_ROOT_PATH || '/violation_data_storage';

export const uploadRoutes = new Elysia()
    .post('/upload', async ({ body }) => {
        const file = body.image;
        const laneId = body.lane_id;
        const action = body.action || 'capture';

        // 1. เลือก ROOT DIRECTORY (จัดให้อยู่ Layer เดียวกัน)
        const rootDir = action === 'RED_LIGHT_VIOLATION' 
            ? VIOLATION_BASE_DIR 
            : TRAFFIC_BASE_DIR;

        // 2. TIMEZONE FIX (UTC+7)
        const now = new Date();
        const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const isoParts = thaiTime.toISOString().split('T');
        
        const dateFolder = isoParts[0]; // "2026-01-27"
        const timeString = isoParts[1].split('.')[0].replace(/:/g, '-'); // "19-30-00"

        // 3. สร้าง FOLDER STRUCTURE
        const targetDir = join(rootDir, laneId, dateFolder);
        await mkdir(targetDir, { recursive: true });

        // -----------------------------------------------------
        // ✅ 4. ตั้งชื่อไฟล์ใหม่ (ไม่มี ACTION ต่อท้าย)
        // ผลลัพธ์จะเป็น: 2026-01-27_19-30-00_Lane_1.jpg
        // -----------------------------------------------------
        const filename = `${dateFolder}_${timeString}_${laneId}.jpg`; 
        const filePath = join(targetDir, filename);

        await Bun.write(filePath, file);

        console.log(`[📂 Saved] ${filePath} | Action Type: ${action}`);

        return {
            status: 'success',
            data: {
                filename: filename,
                path: filePath,
                url: `/images/${action === 'RED_LIGHT_VIOLATION' ? 'violation' : 'traffic'}/${laneId}/${dateFolder}/${filename}`
            }
        };
    }, {
        body: t.Object({
            image: t.File(),
            lane_id: t.String(),
            count: t.Any(),
            action: t.Optional(t.String())
        })
    });