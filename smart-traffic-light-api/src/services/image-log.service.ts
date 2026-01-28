// src/services/image-log.service.ts

import * as fs from 'fs';
import * as path from 'path';

const IMAGE_ROOT_PATH = process.env.IMAGE_ROOT_PATH || 'traffic_data'; 
const STATIC_PREFIX = process.env.STATIC_PREFIX || '/static/traffic-images';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:3000';

const LANE_CONFIG: { [laneName: string]: string } = {
    // ✅ Hardcode เพื่อความชัวร์ใน Docker
    'Lane_1': path.join(IMAGE_ROOT_PATH, 'Lane_1'),
    'Lane_2': path.join(IMAGE_ROOT_PATH, 'Lane_2'),
    'Lane_3': path.join(IMAGE_ROOT_PATH, 'Lane_3'),
    'Lane_4': path.join(IMAGE_ROOT_PATH, 'Lane_4'),
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
    // ... (getLogRecordsFromFiles เดิม คงไว้เหมือนเดิม) ...
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
                    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_/);
                    if (match) {
                        records.push({
                            key: fileName, 
                            date: match[1],
                            time: match[2].replace(/-/g, ':')
                        });
                    }
                });
            });
            return records.sort((a, b) => b.key.localeCompare(a.key));
        } catch (error) {
            return [];
        }
    },

    // ... (getImagesByDateAndLane เดิม คงไว้เหมือนเดิม) ...
    async getImagesByDateAndLane(date: string, laneName: string): Promise<ImageObject[]> {
        const lanePath = LANE_CONFIG[laneName];
        if (!lanePath) return [];

        const datePath = path.join(lanePath, date);
        if (!fs.existsSync(datePath)) return [];
        
        try {
            const fileNames = fs.readdirSync(datePath);
            const allImages: ImageObject[] = [];
            const filteredFiles = fileNames.filter(name => name.match(/(\.jpg|\.jpeg|\.png)$/i));

            filteredFiles.forEach(fileName => {
                const fullPath = path.join(datePath, fileName);
                let relativeUrlPath = path.relative(IMAGE_ROOT_PATH, fullPath).replace(/\\/g, '/');
                const encodedRelativePath = relativeUrlPath.split('/').map(part => encodeURIComponent(part)).join('/');
                const imageUrl = `${BACKEND_BASE_URL}${STATIC_PREFIX}/${encodedRelativePath}`; 

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
    },

    // ✅ เพิ่มฟังก์ชันลบรูปภาพ
    deleteLogRecord: (filename: string, laneName: string) => {
        const lanePath = LANE_CONFIG[laneName];
        if (!lanePath) throw new Error('Invalid Lane configuration');

        // Parse วันที่จากชื่อไฟล์เพื่อหาโฟลเดอร์ย่อย (เช่น 2026-01-27)
        // format: 2026-01-27_21-39-23_Lane_1.jpg
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})_/);
        if (!match) throw new Error('Invalid Filename Format');
        
        const dateFolder = match[1];
        const fullFilePath = path.join(lanePath, dateFolder, filename);

        console.log(`🗑️ Attempting to delete: ${fullFilePath}`);

        if (fs.existsSync(fullFilePath)) {
            fs.unlinkSync(fullFilePath); // ลบไฟล์จริง
            return { success: true, message: 'File deleted successfully' };
        } else {
            // ถ้าไม่เจอไฟล์ อาจจะลองหาในโฟลเดอร์อื่นหรือ return error
            // ในที่นี้ return success false แต่ไม่ throw error เพื่อให้ frontend ทำงานต่อได้
            console.warn(`File not found: ${fullFilePath}`);
            throw new Error('File not found on server');
        }
    }
};