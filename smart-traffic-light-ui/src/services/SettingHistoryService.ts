// src/services/SettingHistoryService.ts
import ApiService from './ApiService';
import type { AxiosResponse } from 'axios';

interface SettingModeLog {
    Log_ID: number;
    Mode_ID: number;
    Admin_ID: number;
    Intersection_ID: number;
    Time: string;
    Date: string;
    Old_Red_Duration: number | null;
    Old_Yellow_Duration: number | null;
    Old_Green_Duration: number | null;
    New_Red_Duration: number | null;
    New_Yellow_Duration: number | null;
    New_Green_Duration: number | null;
    Create_Date: string;
    Update_Date: string;
    Admin_Name: string;
    Mode_Name: string;
}

interface ModeLog {
    Log_ID: number;
    Admin_ID: number;
    Mode_ID: number;
    Date: string;
    Time: string;
    Create_Date: string;
    Update_Date: string;
    Admin_Name: string;
    Mode_Name: string;
}

export async function apiGetSettingModeHistory(): Promise<AxiosResponse<{ history: SettingModeLog[] }>> {
    return ApiService.fetchData({
        url: '/history/setting',
        method: 'get',
    });
}

export async function apiGetModeHistory(): Promise<AxiosResponse<{ history: ModeLog[] }>> {
    return ApiService.fetchData({
        url: '/history/mode',
        method: 'get',
    });
}