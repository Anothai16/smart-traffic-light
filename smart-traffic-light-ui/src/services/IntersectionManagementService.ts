// src/services/IntersectionManagementService.ts
import ApiService from './ApiService';
import type { AxiosResponse } from 'axios';

// Interface ตรงกับ Database
export interface Intersection {
    Intersection_ID: number;
    Name: string;
    Intersection_Number: number;
    IP_Address: string;
    Location: string;
    Create_Date?: string;
    Update_Date?: string;
}

// Interface สำหรับส่งข้อมูล Create/Update (ไม่ต้องส่ง ID ตอน Create)
export interface IntersectionPayload {
    Name: string;
    Intersection_Number: number;
    IP_Address: string;
    Location: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export const IntersectionManagementService = {
    // ดึงข้อมูลทั้งหมด
    async getAllIntersections(): Promise<AxiosResponse<ApiResponse<Intersection[]>>> {
        return ApiService.fetchData({
            url: '/master/intersection',
            method: 'get',
        });
    },

    // สร้างข้อมูลใหม่
    async createIntersection(data: IntersectionPayload): Promise<AxiosResponse<ApiResponse<any>>> {
        return ApiService.fetchData({
            url: '/master/intersection',
            method: 'post',
            data,
        });
    },

    // แก้ไขข้อมูล
    async updateIntersection(id: number, data: IntersectionPayload): Promise<AxiosResponse<ApiResponse<any>>> {
        return ApiService.fetchData({
            url: `/master/intersection/${id}`,
            method: 'put',
            data,
        });
    },

    // ลบข้อมูล
    async deleteIntersection(id: number): Promise<AxiosResponse<ApiResponse<any>>> {
        return ApiService.fetchData({
            url: `/master/intersection/${id}`,
            method: 'delete',
        });
    }
};