// src/controllers/system.controller.ts
import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';

export const SystemController = {
    // 🟢 ฟังก์ชันสั่งเปิด Video
    async startVideo() {
        const scriptPath = path.resolve(__dirname, '../../../start_all_custom.py');
        console.log(`🚀 Executing: python "${scriptPath}"`);

        // ✅ เพิ่มการตั้งค่า Environment เพื่อบังคับใช้ UTF-8
        exec(`python "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Start Video Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`⚠️ Start Video Stderr: ${stderr}`);
            }
            console.log(`✅ Start Video Output:\n${stdout}`);
        });

        return { 
            success: true, 
            message: "ส่งคำสั่งเปิดระบบ Video ไปยังโหนดต่างๆ เรียบร้อยแล้ว" 
        };
    },

    // 🛑 ฟังก์ชันสั่งหยุด Video
    async stopVideo() {
        const scriptPath = path.resolve(__dirname, '../../../stop_all.py');
        console.log(`🛑 Executing: python "${scriptPath}"`);

        // ✅ เพิ่มการตั้งค่า Environment เพื่อบังคับใช้ UTF-8
        exec(`python "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Stop Video Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`⚠️ Stop Video Stderr: ${stderr}`);
            }
            console.log(`✅ Stop Video Output:\n${stdout}`);
        });

        return { 
            success: true, 
            message: "ส่งคำสั่งหยุดระบบ Video เรียบร้อยแล้ว" 
        };
    },
    // เพิ่มต่อจากฟังก์ชัน stopVideo เดิม
    async startPiController() {
        // 📍 ชี้ไปที่ไฟล์ start_pi4.py ที่อยู่ข้างนอกสุด
        const scriptPath = path.resolve(__dirname, '../../../start_pi4.py');
        
        console.log(`🚀 Executing: python "${scriptPath}"`);

        // สั่งรัน Python พร้อมกันปัญหากล่องข้อความ (Emoji) แบบเดิม
        exec(`python "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Start PI Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`⚠️ Start PI Stderr: ${stderr}`);
            }
            console.log(`✅ Start PI Output:\n${stdout}`);
        });

        return { 
            success: true, 
            message: "ส่งคำสั่งเปิด PI Controller เรียบร้อยแล้ว" 
        };
    },
    async stopPiController() {
        // 📍 ชี้ไปที่ไฟล์ stop_pi4.py ที่อยู่ข้างนอกสุด
        const scriptPath = path.resolve(__dirname, '../../../stop_pi4.py');
        
        console.log(`🛑 Executing: python "${scriptPath}"`);

        exec(`python "${scriptPath}"`, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Stop PI Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`⚠️ Stop PI Stderr: ${stderr}`);
            }
            console.log(`✅ Stop PI Output:\n${stdout}`);
        });

        return { 
            success: true, 
            message: "ส่งคำสั่งหยุด PI Controller เรียบร้อยแล้ว" 
        };
    }
};