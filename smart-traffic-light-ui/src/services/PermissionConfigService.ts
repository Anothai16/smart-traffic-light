// src/services/PermissionConfigService.ts

import ApiService from './ApiService';
import type { AxiosResponse } from 'axios';

// --- Interfaces ที่ใช้ร่วมกัน ---

// Interface สำหรับ Key สิทธิ์แต่ละตัว
export interface PermissionKeyItem {
    key: string;
    title: string;
}

// Interface สำหรับข้อมูล Configuration ทั้งหมด
export interface PermissionConfigData {
    allKeys: PermissionKeyItem[];
    permissionsByRole: Record<string, string[]>; 
}

// Interface สำหรับข้อมูลการเปลี่ยนแปลงที่จะส่งไป POST
export interface PermissionChanges {
    [permissionKey: string]: boolean; // เช่น { 'dashboard_view': true }
}

// Interface สำหรับ Response ของการอัปเดต
interface UpdateResponse {
    success: boolean;
    message: string;
}


// --- 1. ฟังก์ชันสำหรับดึงข้อมูล (GET) ---

/**
 * ดึงข้อมูลการกำหนดค่าสิทธิ์ทั้งหมด
 * Endpoint: GET /api/permissions/config
 */
export async function apiGetPermissionConfigData(): Promise<AxiosResponse<{ data: PermissionConfigData }>> {
    return ApiService.fetchData({
        url: '/permissions/config', 
        method: 'get',
    });
}


// --- 2. ฟังก์ชันสำหรับอัปเดตสิทธิ์ (POST) ---

/**
 * อัปเดตสิทธิ์สำหรับ Role ที่ระบุ
 * Endpoint: POST /api/permissions/config
 * @param roleName ชื่อ Role ที่ต้องการแก้ไข
 * @param changes Object ของ { permissionKey: hasAccess(boolean) }
 */
export async function apiUpdateRolePermissions(
    roleName: string,
    changes: PermissionChanges,
): Promise<AxiosResponse<UpdateResponse>> {
    
    const data = { 
        roleName: roleName,
        changes: changes, 
    }; 
    
    return ApiService.fetchData({
        url: '/permissions/config', 
        method: 'post', 
        data, 
    });
}