// src/controllers/dashboard.controller.ts
import { DashboardService } from '../services/dashboard.service';

export const DashboardController = {
    async getAnalytics(startDate: string, endDate: string) {
        try {
            return await DashboardService.getDashboardAnalytics(startDate, endDate);
        } catch (error: any) {
            throw new Error(`Failed to fetch dashboard data: ${error.message}`);
        }
    }
};