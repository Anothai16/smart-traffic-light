// src/controllers/traffic.controller.ts
import { TrafficService } from '../services/traffic.service';

export const TrafficController = {
    async getModes() {
        try {
            const modes = await TrafficService.getModes();
            return { modes };
        } catch (error: any) {
            console.error('Error in getModes controller:', error);
            throw new Error(error.message);
        }
    },

    async getIntersections() {
        try {
            const intersections = await TrafficService.getIntersections();
            return { intersections };
        } catch (error: any) {
            console.error('Error in getIntersections controller:', error);
            throw new Error(error.message);
        }
    },

     async updateIntersections(
        body: { intersections: { Intersection_ID: number; New_Red_Duration: number; New_Green_Duration: number }[] },
        adminId: number
    ) {
        try {
            const { intersections } = body;
            await TrafficService.updateIntersections(intersections, adminId);
            return { success: true, message: 'Intersection times updated successfully.' };
        } catch (error: any) {
            console.error('Error in updateIntersections controller:', error);
            throw new Error(error.message);
        }
    },
    async getCurrentModeStatus() {
        try {
            const currentMode = await TrafficService.getCurrentModeStatus();
            return { currentMode };
        } catch (error: any) {
            console.error('Error in getCurrentModeStatus controller:', error);
            throw new Error(error.message);
        }
    },

    async updateTrafficMode(body: { modeName: string }, adminId: number) {
        try {
            await TrafficService.updateTrafficMode(body.modeName, adminId);
            return { success: true, message: 'Traffic mode updated successfully.' };
        } catch (error: any) {
            console.error('Error in updateTrafficMode controller:', error);
            throw new Error(error.message);
        }
    },
};