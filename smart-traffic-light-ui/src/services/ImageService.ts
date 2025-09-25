// src/services/ImageService.ts (UPDATED FOR LANE PARAMETER)

import ApiService from './ApiService';
import type { AxiosResponse } from 'axios';

// 1. Interface สำหรับ Object รูปภาพที่คาดหวังจาก API
export interface ImageObject {
    id: string; // ID ของรูปภาพ
    url: string; // URL สาธารณะสำหรับแสดงรูปภาพ
    title: string; // ชื่อไฟล์หรือคำบรรยาย
    timestamp: string; // วันที่/เวลาของรูปภาพ
    lane: string; // ✅ เพิ่ม: Lane ที่รูปภาพนี้มาจาก
}

// 2. Interface สำหรับ Response เมื่อดึงรายการวันที่ที่มีรูปภาพ
interface DateListApiResponse {
    dates: string[]; // เช่น ['2025-02-06', '2025-02-07', ...]
}

// 3. ฟังก์ชัน API สำหรับดึงรายการวันที่/Folder ที่มีรูปภาพ
/**
 * ดึงรายการวันที่ (Folder) ที่มีรูปภาพอยู่ 
 * @param laneName ชื่อ Lane ที่เลือก (เช่น 'Lane 1 (PC-A)') 
 * @returns {Promise<string[]>} Array ของวันที่ในรูปแบบ 'YYYY-MM-DD'
 */
export async function apiGetAvailableImageDates(laneName: string): Promise<string[]> { // 🔴 FIX 1: เพิ่ม laneName: string 
    const response = await ApiService.fetchData<DateListApiResponse>({
        // 🔴 FIX 2: ส่ง laneName ไปใน Query Parameter
        url: `/image-log/dates?lane=${encodeURIComponent(laneName)}`, 
        method: 'get', 
    });
    return response.data.dates;
}

// 4. ฟังก์ชัน API สำหรับดึงรูปภาพทั้งหมดตามวันที่และ Lane ที่เลือก
/**
 * ดึงรายการรูปภาพทั้งหมดสำหรับวันที่และ Lane ที่ระบุ
 * @param dateString วันที่ที่เลือกในรูปแบบ 'YYYY-MM-DD'
 * @param laneName ชื่อ Lane ที่เลือก (เช่น 'Lane 1 (PC-A)')
 * @returns {Promise<ImageObject[]>} Array ของ Object รูปภาพพร้อม URL
 */
export async function apiGetImagesByDateAndLane(dateString: string, laneName: string) { // 🔴 อัปเดตชื่อฟังก์ชันและรับ laneName
    const response = await ApiService.fetchData<ImageObject[]>({
        // 🔴 แก้ไข URL: ส่ง date และ lane เป็น Query Parameter
        url: `/image-log/images?date=${dateString}&lane=${encodeURIComponent(laneName)}`, 
        method: 'get', 
    });
    return response.data;
}

// 🔴 Export ฟังก์ชันใหม่เพื่อใช้ใน Component
export { apiGetImagesByDateAndLane as apiGetImagesByDate };