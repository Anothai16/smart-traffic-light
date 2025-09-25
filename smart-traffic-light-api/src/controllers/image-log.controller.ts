// src/controllers/image-log.controller.ts

import { ImageLogService } from '../services/image-log.service';

export const ImageLogController = {
    
    async getAvailableDates(lane: string) { // 🔴 FIX: รับ lane
        return await ImageLogService.scanAvailableDates(lane); // 🔴 FIX: ส่ง lane ต่อ
    },

    async getImagesByDateAndLane(date: string, lane: string) {
        return await ImageLogService.getImagesByDateAndLane(date, lane); 
    },
};