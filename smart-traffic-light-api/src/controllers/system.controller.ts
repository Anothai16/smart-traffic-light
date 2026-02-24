// src/controllers/system.controller.ts
import { Request, Response } from 'express';
import { exec } from 'child_process';

export const SystemController = {
    // 🟢 ฟังก์ชันสั่งเปิด Video
    async startVideo() {
        // ✅ 3.1 แก้ Path ให้ชี้ไปที่ /app_root และไม่ต้องใช้ path.resolve() แล้ว
        const scriptPath = '/app_root/start_all_custom.py';
        
        console.log(`🚀 Executing: python3 "${scriptPath}"`);

        // ✅ 3.2 เปลี่ยนคำสั่งจาก python เป็น python3
        exec(`python3 "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Start Video Error: ${error.message}`);
                return;
            }
            if (stderr) console.error(`⚠️ Start Video Stderr: ${stderr}`);
            console.log(`✅ Start Video Output:\n${stdout}`);
        });

        return { success: true, message: "ส่งคำสั่งเปิดระบบ Video ไปยังโหนดต่างๆ เรียบร้อยแล้ว" };
    },

    // 🛑 ฟังก์ชันสั่งหยุด Video
    async stopVideo() {
        const scriptPath = '/app_root/stop_all.py';
        console.log(`🛑 Executing: python3 "${scriptPath}"`);
        exec(`python3 "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => { /* โค้ด error ดักจับเหมือนด้านบน */ });
        return { success: true, message: "ส่งคำสั่งหยุดระบบ Video เรียบร้อยแล้ว" };
    },

    // 🟢 เริ่ม PI Controller
    async startPiController() {
        const scriptPath = '/app_root/start_pi4.py';
        console.log(`🚀 Executing: python3 "${scriptPath}"`);
        exec(`python3 "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => { /* โค้ด error ดักจับเหมือนด้านบน */ });
        return { success: true, message: "ส่งคำสั่งเปิด PI Controller เรียบร้อยแล้ว" };
    },

    // 🛑 หยุด PI Controller
    async stopPiController() {
        const scriptPath = '/app_root/stop_pi4.py';
        console.log(`🛑 Executing: python3 "${scriptPath}"`);
        exec(`python3 "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => { /* โค้ด error ดักจับเหมือนด้านบน */ });
        return { success: true, message: "ส่งคำสั่งหยุด PI Controller เรียบร้อยแล้ว" };
    }
};