// src/controllers/permission.controller.ts

import { PermissionService, PermissionChanges, PermissionConfigData } from '../services/permission.services'; 
import { Context } from 'elysia'; 
// 💡 ต้องแน่ใจว่าได้ Import Interface จาก Services อย่างถูกต้อง

// --- 1. Controller สำหรับดึงข้อมูลมาแสดงผล (Route 1) ---
/**
 * Controller สำหรับดึงข้อมูลการกำหนดสิทธิ์ทั้งหมด
 * Endpoint: GET /permissions/config
 */
export async function getPermissionConfigController(ctx: Context): Promise<{ success: boolean; data?: PermissionConfigData; message?: string }> {
    try {
        const data = await PermissionService.getPermissionConfigData();
        return { success: true, data };
    } catch (error) {
        console.error('Error in getPermissionConfigController:', error);
        ctx.set.status = 500;
        return { success: false, message: 'Failed to retrieve permission configuration data.' };
    }
}

// --- 2. Controller สำหรับการแก้ไขสิทธิ์ (Route 2) ---
/**
 * Controller สำหรับอัปเดตสิทธิ์ของ Role
 * Endpoint: POST /permissions/config
 */
export async function updateRolePermissionsController(ctx: Context): Promise<{ success: boolean; message: string }> {
    
    // 💡 แก้ไข: ใช้ Type Cast เนื่องจากมีการกำหนด Body Schema ใน Route แล้ว
    const { roleName, changes } = ctx.body as { roleName: string; changes: PermissionChanges };

    if (!roleName || !changes || Object.keys(changes).length === 0) {
        ctx.set.status = 400;
        return { success: false, message: 'Role name and changes data are required for update.' };
    }

    try {
        // เรียกใช้ Service เพื่อทำการอัปเดต
        await PermissionService.updateRolePermissions(roleName, changes);
        return { success: true, message: `Permissions for role '${roleName}' updated successfully.` };
    } catch (error) {
        console.error('Error in updateRolePermissionsController:', error);
        ctx.set.status = 500;
        // สามารถเพิ่ม logic แยกตามประเภท error ได้ ถ้า Service throw error ที่กำหนด
        return { success: false, message: 'Failed to update role permissions.' };
    }
}