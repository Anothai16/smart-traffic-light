// --- src/routes/upload.routes.ts (Updated) ---
import { Elysia, t } from 'elysia';
import { mkdir } from 'fs/promises';
import { join } from 'path';

// ⚠️ แก้ตรงนี้: ให้ใช้ตัวแปรเดียวกับ Service (ถ้าไม่มีให้ใช้ค่า Default)
const UPLOAD_DIR = process.env.IMAGE_ROOT_PATH || 'traffic_data';

export const uploadRoutes = new Elysia()
    .post('/upload', async ({ body }) => {
        const file = body.image;
        const laneId = body.lane_id;
        const count = body.count;
        const action = body.action || 'capture';

        const now = new Date();
        const dateFolder = now.toISOString().split('T')[0]; 
        const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-');

        // พอเป็น Absolute Path แล้ว join จะทำงานได้ถูกต้องทั้ง Linux/Windows
        const targetDir = join(UPLOAD_DIR, laneId, dateFolder);

        await mkdir(targetDir, { recursive: true });

        const filename = `${laneId}_${action}_${timeString}.jpg`;
        const filePath = join(targetDir, filename);

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