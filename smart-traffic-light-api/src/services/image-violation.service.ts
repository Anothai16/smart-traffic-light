import * as fs from 'fs';
import * as path from 'path';

// 1. ชี้ไปที่โฟลเดอร์ Violation
const IMAGE_ROOT_PATH = process.env.VIOLATION_ROOT_PATH || 'violation_data_storage'; 
// 2. Prefix URL ของ Violation
const STATIC_PREFIX = process.env.STATIC_PREFIX_VIOLATION || '/static/violation-images'; 

// 3. Config ให้ตรงกับ Folder จริง (Python Violation บันทึกเป็น Lane_1, Lane_2...)
const LANE_CONFIG: { [laneName: string]: string } = {
    'Lane_1': path.join(IMAGE_ROOT_PATH, 'Lane_1'),
    'Lane_2': path.join(IMAGE_ROOT_PATH, 'Lane_2'),
    'Lane_3': path.join(IMAGE_ROOT_PATH, 'Lane_3'),
    'Lane_4': path.join(IMAGE_ROOT_PATH, 'Lane_4'),
};

export interface ImageViolationObject {
    id: string;
    url: string; 
    title: string;
    timestamp: string; 
    lane: string;
}

export interface ViolationLogRecord {
    key: string;
    date: string;
    time: string;
    lanes?: string;
}

export const ImageViolationService = {
    // ดึง Log Records โดยการ Parse ชื่อไฟล์จาก Lane ที่ระบุ (หรือ Default)
    getLogRecordsFromFiles: (laneName: string = 'Lane_1'): ViolationLogRecord[] => {
        const lanePath = LANE_CONFIG[laneName];
        
        // Debug path
        // console.log(`[Violation] Reading logs from: ${lanePath}`);

        if (!lanePath || !fs.existsSync(lanePath)) return [];

        try {
            const records: ViolationLogRecord[] = [];
            const dateFolders = fs.readdirSync(lanePath).filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f));

            dateFolders.forEach(dateFolder => {
                const fullDatePath = path.join(lanePath, dateFolder);
                const files = fs.readdirSync(fullDatePath);

                files.forEach(fileName => {
                    // Regex จับไฟล์ Violation (อาจจะต้องปรับตามชื่อไฟล์จริงที่ Python ส่งมา)
                    // ตัวอย่าง: 2026-01-27_21-35-05_Lane_1.jpg
                    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_/);
                    if (match) {
                        records.push({
                            key: fileName, 
                            date: match[1],
                            time: match[2].replace(/-/g, ':'), // เปลี่ยน 16-05-59 เป็น 16:05:59
                            lanes: laneName // ระบุว่าเจอในเลนไหน
                        });
                    }
                });
            });
            // เรียงจากใหม่ไปเก่า
            return records.sort((a, b) => b.key.localeCompare(a.key)); 
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getImagesByDateAndLane(date: string, laneName: string): Promise<ImageViolationObject[]> {
        const lanePath = LANE_CONFIG[laneName];
        if (!lanePath) return [];

        const datePath = path.join(lanePath, date);
        if (!fs.existsSync(datePath)) return [];
        
        try {
            const fileNames = fs.readdirSync(datePath);
            const allImages: ImageViolationObject[] = [];
            const filteredFiles = fileNames.filter(name => name.match(/(\.jpg|\.jpeg|\.png)$/i));

            filteredFiles.forEach(fileName => {
                const fullPath = path.join(datePath, fileName);
                
                // คำนวณ Relative Path สำหรับ URL
                let relativeUrlPath = path.relative(IMAGE_ROOT_PATH, fullPath).replace(/\\/g, '/');
                const encodedRelativePath = relativeUrlPath.split('/').map(part => encodeURIComponent(part)).join('/');
                
                // ✅ สร้าง URL (ใช้แบบ Relative เพื่อแก้ปัญหา Proxy/Port)
                const imageUrl = `${STATIC_PREFIX}/${encodedRelativePath}`; 

                // ดึงเวลาจากชื่อไฟล์
                const timeMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})_/);
                let fullTimestamp = date; 
                
                if (timeMatch) {
                    fullTimestamp = `${timeMatch[1]} ${timeMatch[2]}:${timeMatch[3]}:${timeMatch[4]}`;
                }

                allImages.push({
                    id: `${date}-${laneName}-${fileName}`,
                    url: imageUrl, 
                    title: fileName,
                    timestamp: fullTimestamp, 
                    lane: laneName, 
                });
            });

            return allImages.sort((a, b) => b.title.localeCompare(a.title));
        } catch (error) {
            return [];
        }
    }
};