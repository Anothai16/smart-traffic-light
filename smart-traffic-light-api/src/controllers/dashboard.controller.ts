// src/controllers/dashboard.controller.ts
import { DashboardService } from '../services/dashboard.service';

export const DashboardController = {
    async getAnalytics(date: string) {
        try {
            return await DashboardService.getDashboardAnalytics(date);
        } catch (error: any) {
            throw new Error(`Failed to fetch dashboard data: ${error.message}`);
        }
    }
};