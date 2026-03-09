// --- src/@types/auth.ts ---

export interface User {
    username: string
    email: string
    Role: string
    authority: string[]
}

export interface SignInResponse {
    user: User
    token: string
    
}

// export interface SignUpResponse {
//     user: User
//     token: string
// }

export interface SignInCredential {
    username: string
    password: string
}

// export interface SignUpCredential {
//     username: string
//     password: string
//     email: string
// }

