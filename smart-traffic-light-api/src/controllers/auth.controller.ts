// src/controllers/auth.controller.ts
import { AuthService } from '../services/auth.services';

export const AuthController = {
    
    async signIn(body: any) {
        const { username, password } = body;

        const user = await AuthService.findByUsername(username);

        // ✅ ใช้ AuthService.comparePassword() เพื่อตรวจสอบรหัสผ่าน
        if (!user || !(await AuthService.comparePassword(password, user.Password))) {
            throw new Error('Invalid username or password!');
        }

        return {
            user: {
                userId: user.Admin_ID,
                userName: user.Username,
                firstName: user.First_Name,
                lastName: user.Last_Name,
                email: user.Email,
                authority: user.Role.split(','),
            }
        };
    },
};