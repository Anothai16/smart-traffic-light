// src/services/image-log.service.ts (FINAL FIX: URL ENCODING)

import * as fs from 'fs';
import * as path from 'path';

// 🔴 1. ดึง Configuration จาก process.env โดยตรง
const IMAGE_ROOT_PATH = process.env.IMAGE_ROOT_PATH || 'C:\\\\TrafficData'; 
const STATIC_PREFIX = process.env.STATIC_PREFIX || '/static/traffic-images';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8091';

// 🔴 2. สร้าง LANE_CONFIG ใน Service
const LANE_CONFIG: { [laneName: string]: string } = {
    [process.env.LANE_1_NAME || 'Lane 1 (PC-A)']: path.join(IMAGE_ROOT_PATH, process.env.LANE_1_FOLDER || 'Lane 1 (PC-A)'),
    [process.env.LANE_2_NAME || 'Lane 2 (PC-B)']: path.join(IMAGE_ROOT_PATH, process.env.LANE_2_FOLDER || 'Lane 2 (PC-B)'),
    [process.env.LANE_3_NAME || 'Lane 3 (PC-C)']: path.join(IMAGE_ROOT_PATH, process.env.LANE_3_FOLDER || 'Lane 3 (PC-C)'),
    [process.env.LANE_4_NAME || 'Lane 4 (PC-D)']: path.join(IMAGE_ROOT_PATH, process.env.LANE_4_FOLDER || 'Lane 4 (PC-D)'),
};

// 🔴 สร้าง Base URL ล่วงหน้า
const BASE_URL = `${BACKEND_BASE_URL}${STATIC_PREFIX}/`; 

// Helper Functions
const getAvailableLanes = (): string[] => {
    return Object.keys(LANE_CONFIG);
};

const getLanePath = (laneName: string): string | undefined => {
    return LANE_CONFIG[laneName];
};

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
     * @param laneName ชื่อ Lane ที่จะทำการสแกน
     * @returns {string[]} Array ของวันที่
     */
    scanAvailableDates: (laneName: string): string[] => { // 🔴 FIX: รับ laneName
        // 1. หา Path Root ของ Lane นั้นๆ
        const lanePath = LANE_CONFIG[laneName]; // 💡 ใช้ laneName ในการหา Path
        if (!lanePath || !fs.existsSync(lanePath)) {
            console.warn(`[ImageLog] Lane path not found or configured for: ${laneName}`);
            return [];
        }

        // 2. สแกนหา Folder (วันที่) ภายใน lanePath
        try {
            const folders = fs.readdirSync(lanePath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                .filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name)); 
            
            console.log(`[ImageLog] Found available dates for ${laneName}: ${folders.join(', ')}`);
            return folders;

        } catch (error) {
            console.error(`[ImageLog] ❌ ERROR during date folder scan for ${lanePath}:`, error);
            return [];
        }
    },

     /**
     * ดึงรายการรูปภาพทั้งหมดสำหรับวันที่และ Lane ที่ระบุ
     */
    async getImagesByDateAndLane(date: string, laneName: string): Promise<ImageObject[]> {
        const lanePath = LANE_CONFIG[laneName];

        if (!lanePath) {
            console.error(`[ImageLog] Lane configuration not found for: ${laneName}`);
            return [];
        }

        const datePath = path.join(lanePath, date);
        const BASE_URL = `${BACKEND_BASE_URL}${STATIC_PREFIX}/`;

        console.log(`[ImageLog] Root Path (from .env): ${IMAGE_ROOT_PATH}`);
        console.log(`[ImageLog] Target Date Path (System): ${datePath}`);

        if (!fs.existsSync(datePath)) {
            console.warn(`[ImageLog] Image directory not found for date: ${datePath}`);
            return [];
        }
        
        try {
            const fileNames = fs.readdirSync(datePath);
            const allImages: ImageObject[] = [];

            const filteredFiles = fileNames.filter(name => name.match(/(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.svg)$/i));
            console.log(`[ImageLog] Found ${filteredFiles.length} image files in: ${datePath}`);

            // 🛠️ FIX 1: ใช้ String Manipulation ที่เสถียรที่สุดแทน Regex
            // 1. Normalize Root Path (C:/TrafficData หรือ C:\TrafficData) ให้เป็น Forward Slash และลงท้ายด้วย /
            const normalizedRootPath = IMAGE_ROOT_PATH.replace(/\\/g, '/').replace(/\/$/, '') + '/';

            filteredFiles.forEach(fileName => {
                const fullPath = path.join(datePath, fileName);
                
                // 2. Normalize Full Path (C:\TrafficData\...) ให้เป็น Forward Slash ทั้งหมด
                const normalizedFullPath = fullPath.replace(/\\/g, '/');
                
                let relativeUrlPath = '';

                // 3. ตัด Root Path ออกด้วย String Manipulation
                if (normalizedFullPath.startsWith(normalizedRootPath)) {
                    relativeUrlPath = normalizedFullPath.substring(normalizedRootPath.length);
                }
                
                // 🔴 LOG CHECK: เพิ่ม Log เพื่อยืนยันการตัด Path
                console.log(`[ImageLog Check] Normalized Root: ${normalizedRootPath}`);
                console.log(`[ImageLog Check] Normalized Full: ${normalizedFullPath}`);
                
                // 🔴 Check: ถ้าการแทนที่ล้มเหลว (Path ไม่สั้นลง)
                if (relativeUrlPath === '' || normalizedFullPath === relativeUrlPath) {
                    console.error(`[ImageLog] 🚨 CRITICAL ERROR: Failed to remove Root Path. Full Path: ${fullPath}`);
                    console.error(`[ImageLog] 💡 Hint: Check Root Path (from .env) vs Actual Path structure.`);
                    return; // ข้ามไฟล์นี้
                }
                
                // 4. URL Encode Path เพื่อจัดการ Space และ ()
                const encodedRelativePath = encodeURIComponent(relativeUrlPath)
                    // 💡 ต้องเปลี่ยน %2F (จากการเข้ารหัส /) กลับเป็น /
                    .replace(/%2F/g, '/'); 

                const imageUrl = `${BACKEND_BASE_URL}${STATIC_PREFIX}/${encodedRelativePath}`; 

                if (allImages.length === 0) {
                    console.log(`[ImageLog] Example Relative Path (Un-encoded): ${relativeUrlPath}`);
                    console.log(`[ImageLog] Example Encoded Path: ${encodedRelativePath}`);
                    console.log(`[ImageLog] Example Final URL: ${imageUrl}`);
                }

                allImages.push({
                    id: `${date}-${laneName}-${path.basename(fileName, path.extname(fileName))}`,
                    url: imageUrl, 
                    title: fileName,
                    timestamp: date,
                    lane: laneName, 
                });
            });

            return allImages.sort((a, b) => a.title.localeCompare(b.title));

        } catch (error) {
            console.error(`[ImageLog] ❌ CRITICAL ERROR during file reading for ${datePath}:`, error);
            return [];
        }
    }
};