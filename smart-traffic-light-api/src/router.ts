// src/router.ts

import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import * as path from 'path'; // 👈 นำเข้า Path module

// 1. นำเข้า Routes ย่อยทั้งหมด
import { authRoutes } from './routes/auth.routes';
import { accountConfigRoutes } from './routes/account-config.routes';
import { trafficRoutes } from './routes/traffic.routes';
import { settingHistoryRoutes } from './routes/settingHistory.routes';
import { imageLogRoutes } from './routes/image-log.routes'; 
import { permissionRoutes } from './routes/permission.routes'; 

// 🔴 1. ดึง Path จาก Environment Variable (ค่าจาก .env คือ C:\TrafficData)
const rawRootPath = process.env.IMAGE_ROOT_PATH || 'C:\\TrafficData'; 

// 💡 FINAL FIX: สร้าง Path ที่สมบูรณ์แบบสำหรับ Web Server
// 1. path.resolve: แปลงให้เป็น Absolute Path ที่สมบูรณ์ตาม OS (เช่น C:\TrafficData)
// 2. .replace(/\\/g, '/'): แปลง Backslash (\) ทั้งหมดให้เป็น Forward Slash (/)
let IMAGE_ROOT_PATH = path.resolve(rawRootPath).replace(/\\/g, '/');

// 3. Ensure Trailing Slash: เพิ่ม / ปิดท้าย ถ้ายังไม่มี (ช่วยให้ Static Plugin ทำงานกับ Sub-Folder ได้ดีขึ้น)
if (!IMAGE_ROOT_PATH.endsWith('/')) {
    IMAGE_ROOT_PATH += '/';
}

console.log(`[Router Log] Final Static Asset Path: ${IMAGE_ROOT_PATH}`); // 🚨 Log Path สุดท้ายเพื่อตรวจสอบ

const STATIC_PREFIX = process.env.STATIC_PREFIX || '/static/traffic-images';

// 2. สร้าง Router หลักและ Mount Routes ย่อย
export const appRoutes = new Elysia()
    .use(authRoutes)
    .use(accountConfigRoutes)
    .use(trafficRoutes)
    .use(settingHistoryRoutes)
    .use(imageLogRoutes)
    .use(permissionRoutes) 
    .on('beforeHandle', ({ request }) => {
        console.log(`[Global Router] Received Request: ${request.method} ${request.url}`);
    })
    .use(
        staticPlugin({
            assets: IMAGE_ROOT_PATH, // 👈 ใช้ Path ที่ถูก resolve และ Normalize แล้ว (C:/TrafficData/)
            prefix: STATIC_PREFIX,  
            // 🔴 FIX: เพิ่ม deep: true เพื่อให้ค้นหาใน Sub-Folder ได้
            deep: true, 
        } as any) // ใช้ as any เพื่อเลี่ยง Type Error (2353)
    );