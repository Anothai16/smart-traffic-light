// --- src/services/AuthService.ts (แก้ไขแล้ว) ---
import ApiService from './ApiService'
import type {
    SignInCredential,
    SignUpCredential,
    ForgotPassword,
    ResetPassword,
    SignInResponse,
    SignUpResponse,
} from '@/@types/auth'
import { isAxiosError } from 'axios' // ✅ เพิ่มบรรทัดนี้

export async function apiSignIn(data: SignInCredential) {
    try {
        const response = await ApiService.fetchData<SignInResponse>({
            url: '/auth/sign-in',
            method: 'post',
            data: {
                username: data.username,
                password: data.password,    
            },
        })
        
        return response
    } catch (error) {
        if (isAxiosError(error)) {
            console.error('API Sign-In Error:', error.response?.data);
        } else {
            console.error('An unexpected error occurred:', error);
        }
        throw error;
    }
}

export async function apiSignUp(data: SignUpCredential) {
    return ApiService.fetchData<SignUpResponse>({
        url: '/auth/sign-up',
        method: 'post',
        data: {
            username: data.username,
            password: data.password,
            email: data.email
        },
    })
}

export async function apiSignOut() {
    return ApiService.fetchData({
        url: '/auth/sign-out',
        method: 'post',
    })
}

export async function apiForgotPassword(data: ForgotPassword) {
    return ApiService.fetchData({
        url: '/auth/forgot-password',
        method: 'post',
        data: {
            email: data.email
        },
    })
}

export async function apiResetPassword(data: ResetPassword) {
    return ApiService.fetchData({
        url: '/auth/reset-password',
        method: 'post',
        data: {
            password: data.password,
            confirmPassword: data.confirmPassword
        },
    })
}