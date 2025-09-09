// src/controllers/account-config.controller.ts

import { AccountConfigService } from '../services/account-config.services';
import { AuthService } from '../services/auth.services';

export const AccountConfigController = {
    
    /**
     * จัดการตรรกะสำหรับการดึงข้อมูลบัญชีผู้ใช้ทั้งหมด.
     */
    async getAllAccounts() {
        const accounts = await AccountConfigService.getAllAccounts();
        return accounts;
    },

    /**
     * จัดการตรรกะสำหรับการสร้างบัญชีผู้ใช้ใหม่.
     * @param body ข้อมูลใน Request body สำหรับสร้างบัญชี.
     */
    async createAccount(body: any) {
        const { username, password, email } = body;

        const userExists = await AuthService.findByUsername(username);
        const emailUsed = await AuthService.findByEmail(email);

        if (userExists) {
            throw new Error('User already exists!');
        }
        
        if (emailUsed) {
            throw new Error('Email already used!');
        }

        const newAccount = await AccountConfigService.createAccount(body);
        
        return {
            account: {
                accountId: newAccount.Admin_ID,
                username: newAccount.Username,
                email: newAccount.Email,
                role: newAccount.Role,
            }
        };
    },

    /**
     * จัดการตรรกะสำหรับการลบบัญชีผู้ใช้.
     * @param accountId ID ของบัญชีที่ต้องการลบ
     */
    async deleteAccount(accountId: number) {
        if (!accountId) {
            throw new Error('Account ID is required for deletion.');
        }
        await AccountConfigService.deleteAccount(accountId);
    },
    /**
     * ✅ เพิ่ม: จัดการตรรกะสำหรับการลบบัญชีผู้ใช้หลายรายการ.
     * @param accountIds Array ของ Admin_ID ที่ต้องการลบ.
     */
    async deleteAccounts(accountIds: number[]) {
        try {
            const rowsAffected = await AccountConfigService.deleteAccounts(accountIds);
            return {
                message: `${rowsAffected[0]} accounts deleted successfully!`,
            };
        } catch (error: any) {
            throw new Error(error.message);
        }
    },
};