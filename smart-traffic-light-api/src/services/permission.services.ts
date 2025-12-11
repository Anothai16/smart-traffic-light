// src/services/permission.services.ts
import { getDbPool } from '../config/db.config'; 
import { RowDataPacket } from 'mysql2';

// กำหนดสิทธิ์แบบ Hardcode เพราะไม่มีตาราง Permission ใน Database แล้ว
const STATIC_PERMISSIONS: Record<string, string[]> = {
    'SuperAdmin': [
        'nav_home', 'dashboard_view', 'traffic_manage', 'account_config', 
        'picture_view', 'setting_history', 'camera_manage', 'nav_test', 
        'perf_camera_group', 'intersection_view', 'system_performance', 
        'picture_test', 'user_permission_config'
    ],
    'Admin': [
        'nav_home', 'dashboard_view', 'traffic_manage', 'picture_view', 
        'intersection_view'
    ]
};

const STATIC_MENU_ITEMS = [
    { key: 'nav_home', title: 'Home' },
    { key: 'dashboard_view', title: 'Dashboard' },
    { key: 'traffic_manage', title: 'Traffic Management' },
    { key: 'account_config', title: 'Account Configuration' },
    // ... เพิ่มเมนูอื่นๆ ตามต้องการ
];

export interface PermissionConfigData {
    allKeys: { key: string; title: string }[];
    permissionsByRole: Record<string, string[]>;
}

export const PermissionService = {
    async getPermissionsByRole(roleName: string) {
        // คืนค่าจากตัวแปร static แทนการ query database
        return STATIC_PERMISSIONS[roleName] || [];
    },

    async getPermissionConfigData(): Promise<PermissionConfigData> {
        // คืนค่าแบบ Static เพื่อไม่ให้ error
        return {
            allKeys: STATIC_MENU_ITEMS,
            permissionsByRole: STATIC_PERMISSIONS
        };
    },
    
    async updateRolePermissions(roleName: string, changes: any): Promise<void> {
        console.warn('Update permission is disabled in Schema-less mode.');
        // ไม่ทำอะไร เพราะไม่มีตารางให้บันทึก
        return;
    }
};