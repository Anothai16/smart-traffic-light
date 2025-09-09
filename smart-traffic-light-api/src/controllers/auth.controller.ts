// src/controllers/auth.controller.ts
import { AuthService } from '../services/auth.services';

export const AuthController = {
    
    async signIn(body: any) {
        const { username, password } = body;

        const user = await AuthService.findByUsername(username);

        if (!user || AuthService.hashPassword(password) !== user.Password) {
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

    async signUp(body: any) {
        const { username, password, email } = body;

        const userExists = await AuthService.findByUsername(username);
        const emailUsed = await AuthService.findByEmail(email);

        if (userExists) {
            throw new Error('User already exists!');
        }
        
        if (emailUsed) {
            throw new Error('Email already used!');
        }

        const newUser = await AuthService.createAdmin({ username, password, email });
        
        return {
            user: {
                userId: newUser.Admin_ID,
                userName: newUser.Username,
                email: newUser.Email,
                authority: [newUser.Role],
            }
        };
    },
};