// --- src/routes/upload.routes.ts ---
import { Elysia, t } from 'elysia';
import { mkdir } from 'fs/promises';
import { join } from 'path';

// ใช้ตัวแปรเดียวกับ Service (ถ้าไม่มีให้ใช้ค่า Default)
const UPLOAD_DIR = process.env.IMAGE_ROOT_PATH || 'traffic_data';

export const uploadRoutes = new Elysia()
    .post('/upload', async ({ body }) => {
        const file = body.image;
        const laneId = body.lane_id;
        const count = body.count;
        const action = body.action || 'capture';

        // -----------------------------------------------------
        // ✅ TIMEZONE FIX: แปลงเวลาเป็น UTC+7 (Asia/Bangkok)
        // -----------------------------------------------------
        const now = new Date();
        // Docker Container ปกติจะเป็น UTC (+0) เราต้องบวกเพิ่ม 7 ชั่วโมง (ms)
        const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));

        // แปลงเป็น String เพื่อเอาไปตั้งชื่อไฟล์
        // .toISOString() จะได้รูปแบบ "2025-12-16T15:30:00.000Z"
        const isoParts = thaiTime.toISOString().split('T');
        
        const dateFolder = isoParts[0]; // ได้ "2025-12-16"
        
        // เอาส่วนเวลา (15:30:00) มาเปลี่ยน : เป็น -
        const timeString = isoParts[1].split('.')[0].replace(/:/g, '-'); // ได้ "15-30-00"

        // -----------------------------------------------------
        // 📁 FOLDER & FILE LOGIC
        // -----------------------------------------------------
        
        // สร้าง Path โฟลเดอร์: traffic_data/Lane_X/2025-12-16
        const targetDir = join(UPLOAD_DIR, laneId, dateFolder);
        
        // สร้างโฟลเดอร์ถ้ายังไม่มี (Recursive)
        await mkdir(targetDir, { recursive: true });

        // ตั้งชื่อไฟล์: ปี-เดือน-วัน_เวลา_ชื่อเลน_action.jpg
        // ตัวอย่าง: 2025-12-16_15-30-00_Lane_1_green_start.jpg
        const filename = `${dateFolder}_${timeString}_${laneId}_${action}.jpg`; 

        const filePath = join(targetDir, filename);

        // บันทึกไฟล์ลง Disk
        await Bun.write(filePath, file);

        console.log(`[📂 Saved] ${filePath} | Count: ${count}`);

        return {
            status: 'success',
            message: 'Image uploaded successfully',
            data: {
                filename: filename,
                path: filePath,
                url: `/images/${laneId}/${dateFolder}/${filename}`
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