// --- src/@types/auth.ts ---

export interface User {
    username: string
    email: string
    authority: string[]
}

export interface SignInResponse {
    user: User
    token: string
}

export interface SignUpResponse {
    user: User
    token: string
}

export interface SignInCredential {
    username: string
    password: string
}

export interface SignUpCredential {
    username: string
    password: string
    email: string
}

export interface ForgotPassword {
    email: string
}

export interface ResetPassword {
    password: string
    confirmPassword: string
}