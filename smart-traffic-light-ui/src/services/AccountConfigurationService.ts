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

export async function apiDeleteAccount(accountId: number) {
    return ApiService.fetchData({
        url: '/account-config/delete',
        method: 'delete',
        data: { accountId },
    });
}