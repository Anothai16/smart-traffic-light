// src/services/ImageViolationService.ts

import ApiService from './ApiService'

export interface ImageViolationObject {
    id: string
    url: string
    title: string
    timestamp: string
    lane: string
}

export interface ViolationLogRecord {
    key: string
    date: string
    time: string
    lanes?: string // เพิ่มฟิลด์สำหรับแสดงรายชื่อเลนที่พบข้อมูล (เช่น "Lane_1, Lane_2")
}

/**
 * ดึงรายการ Log Records จาก violation_data ทุกเลนแบบรวมกลุ่ม
 * Endpoint: /image-violation/records
 */
export async function apiGetViolationLogRecords(): Promise<
    ViolationLogRecord[]
> {
    const response = await ApiService.fetchData<ViolationLogRecord[]>({
        url: `/image-violation/records`, // ถอด query lane ออกตามโครงสร้าง backend ใหม่
        method: 'get',
    })
    return response.data
}

/**
 * ดึงรูปภาพตามวันที่และเลน จาก violation_data
 * Endpoint: /image-violation/images
 */
export async function apiGetViolationImagesByDateAndLane(
    date: string,
    lane: string,
): Promise<ImageViolationObject[]> {
    const response = await ApiService.fetchData<ImageViolationObject[]>({
        url: `/image-violation/images?date=${date}&lane=${encodeURIComponent(lane)}`,
        method: 'get',
    })
    return response.data
}
