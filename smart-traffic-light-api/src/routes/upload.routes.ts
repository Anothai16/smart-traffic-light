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

        // -----------------------------------------------------
        // ✅ 2. ใช้ชื่อไฟล์ดั้งเดิมจาก YOLO แทนการสร้างเวลาใหม่
        // ชื่อไฟล์ที่ได้มาคือ: 2026-03-05_21-12-51_Lane_1.jpg
        // -----------------------------------------------------
        const filename = file.name;
        
        let dateFolder = '';
        // ดึงวันที่ (YYYY-MM-DD) จากชื่อไฟล์ 10 ตัวอักษรแรก เพื่อเอาไปสร้างโฟลเดอร์
        if (filename && filename.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateFolder = filename.substring(0, 10);
        } else {
            // เผื่อกรณีไฟล์ไม่มีชื่อ ส่งมาจากที่อื่น ให้ดึงเวลาปัจจุบันเป็น Fallback (กันบัค)
            const now = new Date();
            const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
            dateFolder = thaiTime.toISOString().split('T')[0];
        }

        // 3. สร้าง FOLDER STRUCTURE
        const targetDir = join(rootDir, laneId, dateFolder);
        await mkdir(targetDir, { recursive: true });

        // 4. บันทึกไฟล์ด้วยชื่อเดียวกับที่ YOLO ส่งมา
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