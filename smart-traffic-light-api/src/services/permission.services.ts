// src/services/permission.services.ts

import sql from 'mssql';
import { getDbPool } from '../config/dev.config'; 

export interface PermissionKeyItem {
    key: string;
    title: string; // Description/Title for display
}

export interface PermissionConfigData {
    allKeys: PermissionKeyItem[];
    permissionsByRole: Record<string, string[]>; // { 'Admin': ['key1', 'key2'], 'Super Admin': [...] }
}

export interface PermissionChanges {
    [permissionKey: string]: boolean; // { 'dashboard_view': true, 'report_edit': false }
}

/**
 * Service สำหรับดึงข้อมูล Permission Key จากตาราง stl.Role_Permissions.
 */
export const PermissionService = {
    /**
     * ดึงรายการ Permission Key ทั้งหมดตาม Role Name
     * @param roleName ชื่อ Role (เช่น 'SUPER_ADMIN', 'ADMIN')
     * @returns Array ของ Permission Key (เช่น ['nav_home', 'dashboard_view', ...])
     */
    
async getPermissionsByRole(roleName: string) {
    try {
        const pool = await getDbPool();
        const request = new sql.Request(pool);
        
        // 1. ดึง Role_ID จาก Role_Name โดยใช้ ${roleName} เพื่อส่งเป็น Parameter ที่ปลอดภัย
        const roleResult = await request.query`
            SELECT Role_ID 
            FROM stl.Roles 
            WHERE Role_Name = ${roleName} 
        `;

        const roleId = roleResult.recordset[0]?.Role_ID;

        if (!roleId) {
            console.warn(`Role ID not found for Role: ${roleName}`);
            return [];
        }

        // 2. ดึง Permission Keys โดยใช้ Role_ID
        const permissionResult = await request
            .input('roleId', sql.Int, roleId)
            .query`
                SELECT Permission_Key 
                FROM stl.Role_Permissions 
                WHERE Role_ID = @roleId AND Has_Access = 1 
            `;
            
        // 3. จัด Format และคืนค่า (ต้องทำให้เป็นตัวพิมพ์เล็ก เพราะ Frontend มักใช้ตัวเล็ก)
        const authorities = permissionResult.recordset.map(r => r.Permission_Key.toLowerCase());
        return authorities;

    } catch (err) {
        // เพิ่ม console.error เพื่อดู error เต็มๆ
        console.error('SQL error in getPermissionsByRole:', err);
        throw err;
    }
},
 /**
     * 💡 [NEW FUNCTION 1] ดึงข้อมูลการกำหนดสิทธิ์ทั้งหมด (Menu Items, All Roles' Permissions)
     * @returns ข้อมูลสำหรับหน้า Config
     */
    async getPermissionConfigData(): Promise<PermissionConfigData> {
        try {
            const pool = await getDbPool();
            const request = new sql.Request(pool);

            // 1. ดึงรายการ Permissions Keys ทั้งหมด และ Title ของ Menu Item
            const keysResult = await request.query`
                SELECT 
                    Permission_Key  AS [key],
                    Title AS title -- 🔑 FIX: ดึงคอลัมน์ Title จาก stl.Menu_Items และตั้งชื่อเป็น 'title'
                FROM stl.Menu_Items
                ORDER BY Title;
            `;

            const allKeys: PermissionKeyItem[] = keysResult.recordset.map(record => ({
                key: record.key,
                title: record.title,
            }));
            
            // 2. ดึงรายการ Roles ทั้งหมด
            const rolesResult = await request.query`
                SELECT Role_ID, Role_Name 
                FROM stl.Roles;
            `;
            const roles = rolesResult.recordset;
            
            // 3. ดึง Permissions ของแต่ละ Role
            const permissionsByRole: Record<string, string[]> = {};

            for (const role of roles) {
                // สมมติว่ามีฟังก์ชัน getPermissionsByRole ที่ถูกประกาศไว้ก่อนหน้านี้
                const rolePermissions = await this.getPermissionsByRole(role.Role_Name);
                permissionsByRole[role.Role_Name] = rolePermissions;
            }

            return {
                allKeys,
                permissionsByRole,
            };

        } catch (err) {
            console.error('SQL error in getPermissionConfigData:', err);
            throw err;
        }
    },
    
      /**
     * [NEW FUNCTION 2] อัปเดตสิทธิ์สำหรับ Role ที่ระบุ
     * @param roleName ชื่อ Role ที่ต้องการแก้ไข
     * @param changes Object ของ { permissionKey: hasAccess(boolean) }
     */
    async updateRolePermissions(roleName: string, changes: PermissionChanges): Promise<void> {
        if (roleName.toLowerCase() === 'config' || !roleName) {
             throw new Error(`Invalid role name provided: ${roleName}`);
        }
        
        try {
            const pool = await getDbPool();
            const transaction = new sql.Transaction(pool);
            
            await transaction.begin();
            
            try {
                // 💡 [แก้ไข 1]: ไม่สร้าง request object ตรงนี้ 
                // แต่สร้าง request object ภายในลูปแทน

                // 1. ดึง Role_ID (ต้องใช้ request object สำหรับ query นี้)
                const roleRequest = new sql.Request(transaction); // สร้าง Request 1
                const roleResult = await roleRequest.query`
                    SELECT Role_ID 
                    FROM stl.Roles 
                    WHERE Role_Name = ${roleName} 
                `;

                const roleId = roleResult.recordset[0]?.Role_ID;

                if (!roleId) {
                    throw new Error(`Role ID not found for Role: ${roleName}`);
                }

                // 2. วนลูปเพื่ออัปเดต/เพิ่มสิทธิ์
                for (const key in changes) {
                    if (Object.prototype.hasOwnProperty.call(changes, key)) {
                        const hasAccess = changes[key];
                        const permissionKey = key.toUpperCase();
                        
                        // 💡 [การแก้ไขสำคัญ]: ไม่จำเป็นต้องหา Permission_Key_ID
                        // ใช้ Permission_Key ตรงๆ ได้เลย เพราะตาราง stl.Role_Permissions ใช้ Permission_Key เป็นคอลัมน์แล้ว

                        // 3. 💡 [การแก้ไขสำคัญ]: สร้าง Request Object ใหม่ในทุกรอบลูป
                        const updateRequest = new sql.Request(transaction); 
                        
                        // 4. INSERT/UPDATE ใน stl.Role_Permissions (ใช้ Logic สำหรับ SQL Server)
                        // ใช้ .input() เพื่อส่งค่าเข้าสู่ Query อย่างปลอดภัย
                        await updateRequest
                            .input('roleId', sql.Int, roleId)
                            .input('permissionKey', sql.VarChar(100), permissionKey)
                            .input('hasAccess', sql.Bit, hasAccess)
                            .query`
                                IF EXISTS (
                                    SELECT 1 FROM stl.Role_Permissions 
                                    WHERE Role_ID = @roleId AND Permission_Key = @permissionKey
                                )
                                BEGIN
                                    -- UPDATE ถ้ามีอยู่แล้ว
                                    UPDATE stl.Role_Permissions
                                    SET Has_Access = @hasAccess
                                    WHERE Role_ID = @roleId AND Permission_Key = @permissionKey
                                END
                                ELSE
                                BEGIN
                                    -- INSERT ถ้ายังไม่มี
                                    INSERT INTO stl.Role_Permissions (Role_ID, Permission_Key, Has_Access)
                                    VALUES (@roleId, @permissionKey, @hasAccess) 
                                END
                            `;
                    }
                }
                
                await transaction.commit();

            } catch (innerErr) {
                await transaction.rollback();
                throw innerErr;
            }

        } catch (err) {
            console.error('SQL error in updateRolePermissions:', err);
            throw err;
        }
    }
};
