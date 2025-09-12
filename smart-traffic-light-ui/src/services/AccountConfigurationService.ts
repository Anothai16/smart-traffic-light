// src/services/AccountConfigurationService.ts

import ApiService from './ApiService';
import type { AxiosResponse } from 'axios';

interface AccountApiResponse {
    accounts: any[];
}

export async function apiGetAccounts() {
    return ApiService.fetchData<AccountApiResponse>({
        url: '/account-config/list',
        method: 'post',
    });
}

// ✅ เพิ่มฟังก์ชันสำหรับสร้างบัญชีใหม่
// ✅ แก้ไข: ส่ง data ทั้งหมดไปโดยตรง
export async function apiCreateAccount(data: any) {
    return ApiService.fetchData({
        url: '/account-config/create',
        method: 'post',
        data,
    });
}

export async function apiDeleteAccount(accountIds: number[]) {
    return ApiService.fetchData({
        url: '/account-config/delete',
        method: 'post',
        data: { accountIds },
    });
}

/**
 * ✅ เพิ่ม: ฟังก์ชันสำหรับอัปเดตข้อมูลบัญชีผู้ใช้.
 * @param adminId ID ของบัญชีที่ต้องการแก้ไข
 * @param data ข้อมูลใหม่ที่จะนำไปอัปเดต
 * @returns AxiosResponse
 */
export async function apiUpdateAccount(adminId: number, data: any) {
    return ApiService.fetchData({
        url: `/account-config/update/${adminId}`, // กำหนด URL ให้ตรงกับ route ของ backend
        method: 'put', // ใช้ method 'put' สำหรับการอัปเดต
        data,
    });
}


