import { Elysia, t } from 'elysia';
import { mkdir } from 'fs/promises';
import { join } from 'path';

// ✅ แก้ไข: เอา / ออกเพื่อให้สร้างโฟลเดอร์ในโปรเจกต์ (หรือตาม Environment Variable)
const TRAFFIC_BASE_DIR = process.env.IMAGE_ROOT_PATH || 'traffic_data_storage';
const VIOLATION_BASE_DIR = process.env.VIOLATION_ROOT_PATH || 'violation_data_storage';

export const uploadRoutes = new Elysia()
    .post('/upload', async ({ body }) => {
        const file = body.image;
        const laneId = body.lane_id;
        // รับค่า action และทำการ .trim() เพื่อป้องกันช่องว่าง
        const action = (body.action || 'capture').trim();

        // 🔍 [DEBUG LOG] เช็คว่า Python ส่งอะไรมา และระบบตัดสินใจไปโฟลเดอร์ไหน
        console.log(`--------------------------------------------------`);
        console.log(`[📩 Incoming] Lane: ${laneId} | Action: "${action}"`);

        // 1. เลือก ROOT DIRECTORY ตามประเภท Action
        // เช็คเงื่อนไข RED_LIGHT_VIOLATION
        const isViolation = action === 'RED_LIGHT_VIOLATION';
        const rootDir = isViolation ? VIOLATION_BASE_DIR : TRAFFIC_BASE_DIR;

        console.log(`[📁 Target] Root Folder: ${rootDir}`);

        // 2. ใช้ชื่อไฟล์ดั้งเดิมจาก YOLO (เช่น 2026-03-09_16-33-51_Lane_3.jpg)
        const filename = file.name;
        
        let dateFolder = '';
        // ดึงวันที่ (YYYY-MM-DD) จากชื่อไฟล์ 10 ตัวอักษรแรก
        if (filename && filename.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateFolder = filename.substring(0, 10);
        } else {
            // Fallback กรณีชื่อไฟล์ไม่ตรง Format
            const now = new Date();
            const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
            dateFolder = thaiTime.toISOString().split('T')[0];
        }

        try {
            // 3. สร้างโครงสร้าง Folder: root/lane_id/date/
            const targetDir = join(rootDir, laneId, dateFolder);
            await mkdir(targetDir, { recursive: true });

            // 4. กำหนด Path เต็มและเขียนไฟล์
            const filePath = join(targetDir, filename);
            await Bun.write(filePath, file);

            console.log(`[✅ Saved] Path: ${filePath}`);
            console.log(`--------------------------------------------------`);

            return {
                status: 'success',
                data: {
                    filename: filename,
                    path: filePath,
                    type: isViolation ? 'violation' : 'traffic',
                    url: `/images/${isViolation ? 'violation' : 'traffic'}/${laneId}/${dateFolder}/${filename}`
                }
            };

        } catch (error) {
            console.error(`[❌ Error] Cannot save file:`, error);
            return {
                status: 'error',
                message: 'Internal Server Error during file write'
            };
        }
    }, {
        body: t.Object({
            image: t.File(),
            lane_id: t.String(),
            count: t.Any(),
            action: t.Optional(t.String())
        })
    });