// src/services/image-log.service.ts

import * as fs from 'fs';
import * as path from 'path';


// 🔴 1. กำหนดค่า Config (ถ้าไม่มี ENV ให้ใช้ Default)
const IMAGE_ROOT_PATH = process.env.IMAGE_ROOT_PATH || 'traffic_data'; 
const STATIC_PREFIX = process.env.STATIC_PREFIX || '/static/traffic-images';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:3000';

// 🔴 2. สร้าง LANE_CONFIG (จับคู่ชื่อที่แสดง กับ Path จริงในเครื่อง)
const LANE_CONFIG: { [laneName: string]: string } = {
    [process.env.LANE_1_NAME || 'Lane 1']: path.join(IMAGE_ROOT_PATH, process.env.LANE_1_FOLDER || 'Lane1'),
    [process.env.LANE_2_NAME || 'Lane 2']: path.join(IMAGE_ROOT_PATH, process.env.LANE_2_FOLDER || 'Lane2'),
    [process.env.LANE_3_NAME || 'Lane 3']: path.join(IMAGE_ROOT_PATH, process.env.LANE_3_FOLDER || 'Lane3'),
    [process.env.LANE_4_NAME || 'Lane 4']: path.join(IMAGE_ROOT_PATH, process.env.LANE_4_FOLDER || 'Lane4'),
};

console.log('[ImageLog] Final Resolved Config:', LANE_CONFIG);

export interface ImageObject {
    id: string;
    url: string; 
    title: string;
    timestamp: string; 
    lane: string;
}

export const ImageLogService = {
    
    /**
     * สแกนหา Folder วันที่ทั้งหมดที่มีรูปภาพอยู่ใน Lane ที่กำหนด
     * @param laneName ชื่อ Lane ที่จะทำการสแกน (เช่น "Lane East (PC-E)")
     */
    scanAvailableDates: (laneName: string): string[] => {
        const lanePath = LANE_CONFIG[laneName];
        
        if (!lanePath) {
            console.warn(`[ImageLog] Warning: No config found for lane name: "${laneName}"`);
            return [];
        }

        // เช็คว่ามีโฟลเดอร์อยู่จริงไหม
        if (!fs.existsSync(lanePath)) {
            // ไม่ต้อง Error แรง เพราะอาจจะแค่ยังไม่มีรถวิ่งผ่าน
            // console.warn(`[ImageLog] Path not exists yet: ${lanePath}`); 
            return [];
        }

        try {
            const folders = fs.readdirSync(lanePath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                // กรองเฉพาะชื่อโฟลเดอร์ที่เป็นรูปแบบวันที่ YYYY-MM-DD
                .filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name)); 
            
            // เรียงจากวันที่ล่าสุดไปเก่าสุด
            return folders.sort().reverse();

        } catch (error) {
            console.error(`[ImageLog] ❌ Error scanning dates for ${lanePath}:`, error);
            return [];
        }
    },

     /**
      * ดึงรายการรูปภาพทั้งหมดสำหรับวันที่และ Lane ที่ระบุ
      */
    async getImagesByDateAndLane(date: string, laneName: string): Promise<ImageObject[]> {
        const lanePath = LANE_CONFIG[laneName];

        if (!lanePath) return [];

        const datePath = path.join(lanePath, date);

        if (!fs.existsSync(datePath)) {
            console.warn(`[ImageLog] Date folder not found: ${datePath}`);
            return [];
        }
        
        try {
            const fileNames = fs.readdirSync(datePath);
            const allImages: ImageObject[] = [];

            // กรองเฉพาะไฟล์รูปภาพ
            const filteredFiles = fileNames.filter(name => name.match(/(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.svg)$/i));

            // 🛠️ Path Normalization: ทำให้ Path เป็นรูปแบบเดียวกัน (Forward Slash)
            // เพื่อให้ตัด String ได้ถูกต้องไม่ว่าจะรันบน Windows หรือ Linux
            const normalizedRootPath = IMAGE_ROOT_PATH.replace(/\\/g, '/').replace(/\/$/, '') + '/';

            filteredFiles.forEach(fileName => {
                const fullPath = path.join(datePath, fileName);
                const normalizedFullPath = fullPath.replace(/\\/g, '/');
                
                let relativeUrlPath = '';

                // ตัดส่วน Root Path ออก เพื่อเอาแค่ Path ย่อย
                if (normalizedFullPath.startsWith(normalizedRootPath)) {
                    relativeUrlPath = normalizedFullPath.substring(normalizedRootPath.length);
                } else {
                     // Fallback: ใช้ path.relative ช่วยถ้าตัด string ตรงๆ ไม่ได้
                     relativeUrlPath = path.relative(IMAGE_ROOT_PATH, fullPath).replace(/\\/g, '/');
                }
                
                // ✅ SAFER URL ENCODING
                // แยกส่วน Path ด้วย / แล้ว Encode ทีละส่วน แล้วประกอบกลับ
                // วิธีนี้จะแปลง "Lane West" -> "Lane%20West" แต่ไม่แปลง "/" -> "%2F"
                const encodedRelativePath = relativeUrlPath
                    .split('/')
                    .map(part => encodeURIComponent(part))
                    .join('/');

                const imageUrl = `${BACKEND_BASE_URL}${STATIC_PREFIX}/${encodedRelativePath}`; 

                allImages.push({
                    id: `${date}-${laneName}-${fileName}`,
                    url: imageUrl, 
                    title: fileName,
                    timestamp: date,
                    lane: laneName, 
                });
            });

            // เรียงลำดับรูปภาพ (ใหม่ -> เก่า) โดยดูจากชื่อไฟล์
            return allImages.sort((a, b) => b.title.localeCompare(a.title));

        } catch (error) {
            console.error(`[ImageLog] ❌ Error reading images from ${datePath}:`, error);
            return [];
        }
    }
};