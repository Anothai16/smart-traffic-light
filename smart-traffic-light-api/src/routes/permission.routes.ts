// src/routes/permission.routes.ts

import { Elysia, t } from 'elysia'; 
import { PermissionService } from '../services/permission.services';
import { 
    getPermissionConfigController, 
    updateRolePermissionsController 
} from '../controllers/permission.controller'; 

// Route สำหรับดึงสิทธิ์การเข้าถึง (Permission Keys)
export const permissionRoutes = new Elysia({ prefix: '/permissions' })

    .get('/config', getPermissionConfigController) 
    
    .post(
        '/config', 
        updateRolePermissionsController,
        {
            // 💡 เพิ่ม Body Schema เพื่อแก้ไข TypeScript Error และใช้ Validation
            body: t.Object({
                roleName: t.String({ description: 'The name of the role to update permissions for.' }),
                changes: t.Record(t.String(), t.Boolean(), { description: 'Object containing permissionKey and boolean access value.' })
            })
        }
    )
    
    // *** [ROUTE เดิม] ต้องอยู่ 'หลัง' STATIC ROUTES เสมอ ***
    // Endpoint: GET /permissions/:roleName
    .get('/:roleName', async (ctx) => {
        const { roleName } = ctx.params;
        
        if (!roleName) {
            ctx.set.status = 400;
            return { message: 'Role name is required.' };
        }
        
        try {
            const permissions = await PermissionService.getPermissionsByRole(roleName);
            return { authorities: permissions }; 
        } catch (error) {
            console.error('Error fetching permissions:', error);
            ctx.set.status = 500;
            return { message: 'Failed to retrieve permissions.' };
        }
    });