// src/services/DashboardService.ts
import ApiService from './ApiService'

export interface DashboardResponse {
    date: string
    lanes: Array<{
        laneKey: number
        laneName: string
        vehicleCount: number
        violation_count: number
    }>
    hourly: Array<{
        hour: string
        [key: string]: any
    }>
    weekly: Array<{
        dayName: string
        total: number
        [key: string]: any
    }>
}

export async function apiGetDashboardAnalytics(
    startDate: string,
    endDate: string
): Promise<DashboardResponse> {
    const response = await ApiService.fetchData<DashboardResponse>({
        url: `/dashboard/analytics?startDate=${startDate}&endDate=${endDate}`,
        method: 'get',
    })
    return response.data
}