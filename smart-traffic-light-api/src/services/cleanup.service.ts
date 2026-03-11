import { readdir, rm } from 'fs/promises';
import { join } from 'path';
import { getDbPool } from '../config/db.config';

const TRAFFIC_BASE_DIR = process.env.IMAGE_ROOT_PATH || 'traffic_data_storage';

export const TestCleanupService = {
    async executeHardcodeDelete() {
        // =======================================================
        // 🎯 [HARDCODE ตรงนี้] ระบุ "วันที่" และ "เวลา" ที่ต้องการจะลบ
        // =======================================================
        const targetDate = '2026-03-10';  // รูปแบบ YYYY-MM-DD
        const targetTime = '11:24:22';    // รูปแบบ HH:MM:SS (ตามที่อยู่ใน Database)

        console.log(`\n🧹 [Test Cleanup] กำลังค้นหาและลบรูปภาพ+DB ของวันที่: ${targetDate} เวลา: ${targetTime}`);

        // สร้าง prefix สำหรับหาชื่อไฟล์ (เพราะชื่อไฟล์จาก YOLO จะใช้ - แทน : เช่น 12-00-00)
        const timeForFilename = targetTime.replace(/:/g, '-');
        const filePrefix = `${targetDate}_${timeForFilename}`; // จะได้ "2026-03-10_12-00-00"

        // --- 1. ลบไฟล์จริงในโฟลเดอร์ของทุกเลน ---
        try {
            // อ่านโฟลเดอร์ Lane ทั้งหมด (Lane_1, Lane_2, ...)
            const lanes = await readdir(TRAFFIC_BASE_DIR, { withFileTypes: true });
            
            for (const lane of lanes) {
                if (!lane.isDirectory()) continue;
                
                // เข้าไปที่โฟลเดอร์วันที่ของเลนนั้นๆ
                const targetDirPath = join(TRAFFIC_BASE_DIR, lane.name, targetDate);
                
                try {
                    // อ่านไฟล์ทั้งหมดในโฟลเดอร์นั้น
                    const files = await readdir(targetDirPath, { withFileTypes: true });
                    
                    for (const file of files) {
                        // 🟢 ถ้าเป็นไฟล์ และชื่อไฟล์มี วันที่_เวลา ที่เรากำหนดไว้ ให้ลบทิ้ง!
                        if (file.isFile() && file.name.includes(filePrefix)) {
                            const filePath = join(targetDirPath, file.name);
                            await rm(filePath, { force: true });
                            console.log(`[🗑️ FS Deleted] ลบรูปภาพสำเร็จ: ${filePath}`);
                        }
                    }
                } catch (err: any) {
                    // หาโฟลเดอร์วันนั้นไม่เจอ ก็ข้ามไปเงียบๆ
                    if (err.code !== 'ENOENT') {
                        console.error(`[❌ FS Error] ตรวจสอบโฟลเดอร์ไม่ได้: ${targetDirPath}`, err);
                    }
                }
            }
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                console.error('[❌ FS Error] ไม่สามารถเข้าถึงโฟลเดอร์ traffic_data_storage ได้:', err);
            }
        }

        // --- 2. อัปเดต Database ให้ Picture_Path เป็น NULL ตามวันและเวลาที่กำหนด ---
        try {
            const pool = await getDbPool();
            // 🟢 เคลียร์ค่า Picture_Path ให้เป็น NULL โดยเช็คทั้ง Date และ Time
            const [result] = await pool.execute(`
                UPDATE Traffic_Log 
                SET Picture_Path = NULL 
                WHERE Date = ? AND Time = ? AND Picture_Path IS NOT NULL
            `, [targetDate, targetTime]);
            
            const affectedRows = (result as any).affectedRows;
            if (affectedRows > 0) {
                console.log(`[✅ DB Updated] เคลียร์ชื่อรูปภาพของวันที่ ${targetDate} เวลา ${targetTime} ในฐานข้อมูลแล้ว (${affectedRows} แถว)`);
            } else {
                console.log(`[⚠️ DB Info] ไม่พบรูปของวันที่ ${targetDate} เวลา ${targetTime} ค้างอยู่ใน Database`);
            }
        } catch (dbErr) {
            console.error('[❌ DB Error] ไม่สามารถอัปเดตตาราง Database ได้:', dbErr);
        }
    }
};