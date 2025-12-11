// src/controllers/intersection.controller.ts
import { IntersectionService, Intersection } from '../services/intersection.service';

export const IntersectionController = {
    async getAll() {
        try {
            const intersections = await IntersectionService.getAll();
            return { success: true, data: intersections };
        } catch (error: any) {
            console.error('Error fetching intersections:', error);
            throw new Error('Failed to fetch intersections');
        }
    },

    async create(body: Intersection) {
        try {
            const id = await IntersectionService.create(body);
            return { success: true, message: 'Intersection created successfully', id };
        } catch (error: any) {
            console.error('Error creating intersection:', error);
            throw new Error('Failed to create intersection');
        }
    },

    async update(id: number, body: Intersection) {
        try {
            await IntersectionService.update(id, body);
            return { success: true, message: 'Intersection updated successfully' };
        } catch (error: any) {
            console.error('Error updating intersection:', error);
            throw new Error('Failed to update intersection');
        }
    },

    async delete(id: number) {
        try {
            await IntersectionService.delete(id);
            return { success: true, message: 'Intersection deleted successfully' };
        } catch (error: any) {
            console.error('Error deleting intersection:', error);
            throw new Error('Failed to delete intersection');
        }
    }
};