// src/services/DashboardService.ts
import ApiService from './ApiService'; // ใช้โครงสร้างเดียวกับ ImageService.ts

export interface DashboardResponse {
    date: string;
    lanes: Array<{
        laneKey: number;
        laneName: string;
        vehicleCount: number;
        violation_count: number;
        red: number;
        yellow: number;
        green: number;
    }>;
    hourly: Array<{
        hour: string;
        [key: string]: any;
    }>;
    weekly: Array<{
        dayName: string;
        total: number;
        [key: string]: any;
    }>;
}

export async function apiGetDashboardAnalytics(date: string): Promise<DashboardResponse> {
    const response = await ApiService.fetchData<DashboardResponse>({
        url: `/dashboard/analytics?date=${date}`,
        method: 'get',
    });
    return response.data;
}