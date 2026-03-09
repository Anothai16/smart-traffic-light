// src/services/AccountConfigurationService.ts

import ApiService from './ApiService'
import type { AxiosResponse } from 'axios'

interface AccountApiResponse {
    accounts: any[]
}

export async function apiGetAccounts() {
    return ApiService.fetchData<AccountApiResponse>({
        url: '/account-config/list',
        method: 'post',
    })
}

export async function apiCreateAccount(data: any) {
    return ApiService.fetchData({
        url: '/account-config/create',
        method: 'post',
        data,
    })
}

export async function apiDeleteAccount(accountIds: number[]) {
    return ApiService.fetchData({
        url: '/account-config/delete',
        method: 'post',
        data: { accountIds },
    })
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
    })
}

/**
 * ✅ เพิ่ม: ฟังก์ชันสำหรับเปลี่ยนรหัสผ่านของผู้ใช้ปัจจุบัน
 * @param oldPassword รหัสผ่านเดิม
 * @param newPassword รหัสผ่านใหม่
 */
export async function apiChangePassword(
    oldPassword: string,
    newPassword: string,
) {
    try {
        const response = await ApiService.fetchData({
            url: '/account-config/change-password',
            method: 'put',
            data: {
                oldPassword,
                newPassword,
            },
        })
        return response
    } catch (error: any) {
        // ✅ ส่งข้อความ error จาก backend กลับมา
        throw new Error(
            error.response?.data?.message || 'Failed to change password',
        )
    }
}
