import * as fs from 'fs';
import * as path from 'path';

const IMAGE_ROOT_PATH = process.env.IMAGE_ROOT_PATH || 'traffic_data'; 
const STATIC_PREFIX = process.env.STATIC_PREFIX || '/static/traffic-images';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:3000';

const LANE_CONFIG: { [laneName: string]: string } = {
    'Lane_1': path.join(IMAGE_ROOT_PATH, process.env.LANE_1_FOLDER || 'Lane1'),
    'Lane_2': path.join(IMAGE_ROOT_PATH, process.env.LANE_2_FOLDER || 'Lane2'),
    'Lane_3': path.join(IMAGE_ROOT_PATH, process.env.LANE_3_FOLDER || 'Lane3'),
    'Lane_4': path.join(IMAGE_ROOT_PATH, process.env.LANE_4_FOLDER || 'Lane4'),
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
    // ดึง Log Records โดยการ Parse ชื่อไฟล์จาก Lane 1
    getLogRecordsFromFiles: (laneName: string): LogRecord[] => {
        const lanePath = LANE_CONFIG[laneName];
        if (!lanePath || !fs.existsSync(lanePath)) return [];

        try {
            const records: LogRecord[] = [];
            const dateFolders = fs.readdirSync(lanePath).filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f));

            dateFolders.forEach(dateFolder => {
                const fullDatePath = path.join(lanePath, dateFolder);
                const files = fs.readdirSync(fullDatePath);

                files.forEach(fileName => {
                    // Regex: 2025-12-16_16-05-59_...
                    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_/);
                    if (match) {
                        records.push({
                            key: fileName, 
                            date: match[1],
                            time: match[2].replace(/-/g, ':') // เปลี่ยน 16-05-59 เป็น 16:05:59
                        });
                    }
                });
            });
            return records.sort((a, b) => b.key.localeCompare(a.key)); // ใหม่ไปเก่า
        } catch (error) {
            return [];
        }
    },

    async getImagesByDateAndLane(date: string, laneName: string): Promise<ImageObject[]> {
        const lanePath = LANE_CONFIG[laneName];
        if (!lanePath) return [];

        const datePath = path.join(lanePath, date);
        if (!fs.existsSync(datePath)) return [];
        
        try {
            const fileNames = fs.readdirSync(datePath);
            const allImages: ImageObject[] = [];
            const filteredFiles = fileNames.filter(name => name.match(/(\.jpg|\.jpeg|\.png)$/i));

            const normalizedRootPath = IMAGE_ROOT_PATH.replace(/\\/g, '/').replace(/\/$/, '') + '/';

            filteredFiles.forEach(fileName => {
                const fullPath = path.join(datePath, fileName);
                const normalizedFullPath = fullPath.replace(/\\/g, '/');
                let relativeUrlPath = path.relative(IMAGE_ROOT_PATH, fullPath).replace(/\\/g, '/');
                
                const encodedRelativePath = relativeUrlPath.split('/').map(part => encodeURIComponent(part)).join('/');
                const imageUrl = `${BACKEND_BASE_URL}${STATIC_PREFIX}/${encodedRelativePath}`; 

                // 🔴 แก้ไขจุดนี้: ดึงเวลาจากชื่อไฟล์มาใส่ใน timestamp
                // ชื่อไฟล์ตัวอย่าง: 2025-12-16_16-07-39_Lane_3_red_start.jpg
                const timeMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})_/);
                let fullTimestamp = date; // fallback เป็นแค่วันที่ถ้า parse ไม่ได้
                
                if (timeMatch) {
                    // สร้าง format: "YYYY-MM-DD HH:mm:ss"
                    fullTimestamp = `${timeMatch[1]} ${timeMatch[2]}:${timeMatch[3]}:${timeMatch[4]}`;
                }

                allImages.push({
                    id: `${date}-${laneName}-${fileName}`,
                    url: imageUrl, 
                    title: fileName,
                    timestamp: fullTimestamp, // ✅ ส่งเวลาเต็มไปให้ Frontend
                    lane: laneName, 
                });
            });

            return allImages.sort((a, b) => b.title.localeCompare(a.title));
        } catch (error) {
            return [];
        }
    }
};