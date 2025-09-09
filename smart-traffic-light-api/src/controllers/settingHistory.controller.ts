// src/controllers/settingHistory.controller.ts
import { SettingHistoryService } from '../services/settingHistory.service';

export const SettingHistoryController = {
    async getSettingModeHistory() {
        try {
            const history = await SettingHistoryService.getSettingModeHistory();
            return { history };
        } catch (error: any) {
            console.error('Error in getSettingModeHistory controller:', error);
            throw new Error(error.message);
        }
    },

    async getModeHistory() {
        try {
            const history = await SettingHistoryService.getModeHistory();
            return { history };
        } catch (error: any) {
            console.error('Error in getModeHistory controller:', error);
            throw new Error(error.message);
        }
    }
};