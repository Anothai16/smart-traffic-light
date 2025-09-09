// src/services/TrafficService.ts

import ApiService from './ApiService';
import type { AxiosResponse } from 'axios';

interface TrafficMode {
    Mode_ID: number;
    Mode_Name: string;
}

interface IntersectionTimeData {
    Intersection_ID: number;
    Name: string;
    New_Red_Duration: number;
    New_Green_Duration: number;
}

interface UpdateIntersectionPayload {
    intersections: {
        Intersection_ID: number;
        New_Red_Duration: number;
        New_Green_Duration: number;
    }[];
}

interface UpdateTrafficModePayload {
    modeName: string;
}

interface UpdateResponse {
    success: boolean;
    message: string;
}

// ✅ เพิ่ม Interface สำหรับ Response ของ apiGetModeStatus
interface CurrentStatusResponse {
    currentMode: string;
}

export async function apiGetTrafficModes(): Promise<AxiosResponse<{ modes: TrafficMode[] }>> {
    return ApiService.fetchData({
        url: '/traffic/modes',
        method: 'get',
    });
}

export async function apiGetIntersectionData(): Promise<AxiosResponse<{ intersections: IntersectionTimeData[] }>> {
    return ApiService.fetchData({
        url: '/traffic/intersections',
        method: 'get',
    });
}

// ✅ เพิ่มฟังก์ชันใหม่: apiGetModeStatus
export async function apiGetModeStatus(): Promise<AxiosResponse<CurrentStatusResponse>> {
    return ApiService.fetchData({
        url: '/traffic/status',
        method: 'get',
    });
}

// ✅ เพิ่มฟังก์ชันใหม่: apiUpdateTrafficMode
export async function apiUpdateTrafficMode(data: UpdateTrafficModePayload): Promise<AxiosResponse<UpdateResponse>> {
    return ApiService.fetchData({
        url: '/traffic/mode',
        method: 'post',
        data,
    });
}

export async function apiUpdateIntersectionTimes(
    data: UpdateIntersectionPayload,
): Promise<AxiosResponse<UpdateResponse>> {
    return ApiService.fetchData({
        url: '/traffic/update-intersections',
        method: 'post',
        data,
    });
}