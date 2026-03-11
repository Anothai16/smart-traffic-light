import ApiService from './ApiService'; 

export interface ControlResponse {
    message: string;
    success?: boolean;
}

// 🟢 ฟังก์ชันสำหรับสั่งเปิด Video (Start)
export async function apiStartVideo(): Promise<ControlResponse> {
    const response = await ApiService.fetchData<ControlResponse>({
        url: '/system/start-video', // 🔴 URL นี้ต้องตรงกับฝั่ง Backend
        method: 'post',
    });
    return response.data;
}

// 🛑 ฟังก์ชันสำหรับสั่งหยุด Video (Stop)
export async function apiStopVideo(): Promise<ControlResponse> {
    const response = await ApiService.fetchData<ControlResponse>({
        url: '/system/stop-video', // 🔴 URL นี้ต้องตรงกับฝั่ง Backend
        method: 'post',
    });
    return response.data;
}

// เพิ่มต่อท้ายไฟล์เดิม
export async function apiStartPiController(): Promise<ControlResponse> {
    const response = await ApiService.fetchData<ControlResponse>({
        url: '/system/start-pi4', // 🔴 ยิงไปที่ Endpoint ใหม่
        method: 'post',
    });
    return response.data;
}

export async function apiStopPiController(): Promise<ControlResponse> {
    const response = await ApiService.fetchData<ControlResponse>({
        url: '/system/stop-pi4', // 🔴 ยิงไปที่ Endpoint สำหรับหยุด PI
        method: 'post',
    });
    return response.data;
}