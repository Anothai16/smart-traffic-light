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
        const { username, Email, ID_Card, Phone_Number } = body; 

        const userExists = await AuthService.findByUsername(username);
        const emailUsed = await AuthService.findByEmail(Email);
        const idCardUsed = await AccountConfigService.findByIDCard(ID_Card); 
        const phoneNumberUsed = await AccountConfigService.findByPhoneNumber(Phone_Number); 

        if (userExists) {
            throw new Error('User already exists!');
        }
        
        if (emailUsed) {
            throw new Error('Email already used!');
        }

        if (idCardUsed) {
            throw new Error('ID Card already used!');
        }
        
        if (phoneNumberUsed) {
            throw new Error('Phone Number already used!');
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
     * จัดการตรรกะสำหรับการลบบัญชีผู้ใช้หลายรายการ
     * @param accountIds ID ของบัญชีที่ต้องการลบ (ในรูปแบบ Array)
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
    
    /**
     * จัดการตรรกะสำหรับการอัปเดตบัญชีผู้ใช้.
     * @param accountId ID ของบัญชีที่ต้องการอัปเดต
     * @param body ข้อมูลใน Request body สำหรับอัปเดตบัญชี.
     */
    async updateAccount(accountId: number, body: any) {
        if (!accountId) {
            throw new Error('Account ID is required for update.');
        }

        const { Email, ID_Card, Phone_Number } = body; 
        const currentAccount = await AccountConfigService.getAccountById(accountId);

        if (Email !== currentAccount.Email) {
            const emailUsed = await AuthService.findByEmail(Email);
            if (emailUsed) {
                if (emailUsed.Admin_ID !== accountId) {
                    throw new Error('Email already used!');
                }
            }
        }
        
        if (ID_Card !== currentAccount.ID_Card) {
            const idCardUsed = await AccountConfigService.findByIDCard(ID_Card);
            if (idCardUsed) {
                if (idCardUsed.Admin_ID !== accountId) {
                    throw new Error('ID Card already used!');
                }
            }
        }
        
        if (Phone_Number !== currentAccount.Phone_Number) {
            const phoneNumberUsed = await AccountConfigService.findByPhoneNumber(Phone_Number);
            if (phoneNumberUsed) {
                if (phoneNumberUsed.Admin_ID !== accountId) {
                    throw new Error('Phone Number already used!');
                }
            }
        }
        
        await AccountConfigService.updateAccount(accountId, body);
    },
    /**
     * ✅ NEW: จัดการตรรกะสำหรับเปลี่ยนรหัสผ่านของผู้ใช้
     * @param adminId ID ของผู้ใช้
     * @param body ข้อมูลใน Request body: oldPassword และ newPassword
     */
    async changePassword(adminId: number, body: { oldPassword: string, newPassword: string }) {
        const { oldPassword, newPassword } = body;
        
        // ตรวจสอบว่ามีรหัสผ่านเก่าและใหม่หรือไม่
        if (!oldPassword || !newPassword) {
            throw new Error('Old password and new password are required.');
        }

        // เรียก Service เพื่อทำการเปลี่ยนรหัสผ่าน
        const result = await AccountConfigService.changePassword(adminId, oldPassword, newPassword);
        return result;
    },
};