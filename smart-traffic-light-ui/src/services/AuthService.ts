// --- src/services/AuthService.ts  ---
import ApiService from './ApiService'
import type { SignInCredential, SignInResponse } from '@/@types/auth'
import { isAxiosError } from 'axios'

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
            console.error('API Sign-In Error:', error.response?.data)
        } else {
            console.error('An unexpected error occurred:', error)
        }
        throw error
    }
}

export async function apiSignOut() {
    return ApiService.fetchData({
        url: '/auth/sign-out',
        method: 'post',
    })
}
