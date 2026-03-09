import * as fs from 'fs';
import * as path from 'path';

// 1. ชี้ไปที่โฟลเดอร์ Violation
const IMAGE_ROOT_PATH = process.env.VIOLATION_ROOT_PATH || 'violation_data_storage'; 
// 2. Prefix URL ของ Violation
const STATIC_PREFIX = process.env.STATIC_PREFIX_VIOLATION || '/static/violation-images'; 

// 3. Config ให้ตรงกับ Folder จริง
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
    _getRecordsBySingleLane: (laneName: string): ViolationLogRecord[] => {
        const lanePath = LANE_CONFIG[laneName];
        if (!lanePath || !fs.existsSync(lanePath)) return [];

        try {
            const records: ViolationLogRecord[] = [];
            // กรองเฉพาะโฟลเดอร์วันที่ (YYYY-MM-DD)
            const dateFolders = fs.readdirSync(lanePath).filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f));

            dateFolders.forEach(dateFolder => {
                const fullDatePath = path.join(lanePath, dateFolder);
                const files = fs.readdirSync(fullDatePath);

                files.forEach(fileName => {
                    // กรองเฉพาะไฟล์รูปภาพ
                    if (!fileName.match(/(\.jpg|\.jpeg|\.png)$/i)) return;

                    // Regex จับชื่อไฟล์ (ปรับให้ตรงกับ Pattern ของคุณ)
                    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_/);
                    if (match) {
                        records.push({
                            // ใส่ laneName ใน Key กันซ้ำ 
                            key: `${laneName}_${fileName}`, 
                            date: match[1],
                            time: match[2].replace(/-/g, ':'), 
                            lanes: laneName
                        });
                    }
                });
            });
            return records;
        } catch (error) {
            console.error(`Error reading ${laneName}:`, error);
            return [];
        }
    },

    // -------------------------------------------------------------------------
    //  ดึงข้อมูลจาก "ทุก Lane" และเรียงลำดับใหม่สุดก่อน
    // -------------------------------------------------------------------------
    getLogRecordsFromFiles: (requestedLane?: string): ViolationLogRecord[] => {
        let allRecords: ViolationLogRecord[] = [];

        if (requestedLane && LANE_CONFIG[requestedLane]) {
            // กรณีระบุเลนมา (เผื่ออนาคตอยาก filter)
            allRecords = ImageViolationService._getRecordsBySingleLane(requestedLane);
        } else {
            //  กรณีไม่ระบุ (Default) -> วนลูปดึง "ทุก Lane" ใน LANE_CONFIG
            Object.keys(LANE_CONFIG).forEach(laneName => {
                const laneRecords = ImageViolationService._getRecordsBySingleLane(laneName);
                allRecords = allRecords.concat(laneRecords);
            });
        }

        //  เรียงลำดับ (Sorting) ด้วย Timestamp จริง
        return allRecords.sort((a, b) => {
            // สร้าง Date Object เพื่อเปรียบเทียบค่าเวลา
            // Format: YYYY-MM-DDTHH:mm:ss
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            
            // เรียงจาก มาก -> น้อย (ใหม่ -> เก่า)
            return dateB.getTime() - dateA.getTime();
        });
    },

    // -------------------------------------------------------------------------
    //  ฟังก์ชันดึงรูปภาพ 
    // -------------------------------------------------------------------------
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
                let relativeUrlPath = path.relative(IMAGE_ROOT_PATH, fullPath).replace(/\\/g, '/');
                const encodedRelativePath = relativeUrlPath.split('/').map(part => encodeURIComponent(part)).join('/');
                const imageUrl = `${STATIC_PREFIX}/${encodedRelativePath}`; 

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