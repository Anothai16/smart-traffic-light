// src/store/slices/sessionSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SLICE_BASE_NAME } from './constants'

export interface SessionState {
    signedIn: boolean
    token: string | null
}

// ✅ แก้ไข 1: ดึง Token จาก LocalStorage มาเป็นค่าเริ่มต้น
const storedToken = localStorage.getItem('token'); 

const initialState: SessionState = {
    signedIn: !!storedToken, // ถ้ามี token ให้ถือว่า login แล้ว
    token: storedToken,      // ใส่ token ที่เก็บไว้ลงไป
}

const sessionSlice = createSlice({
    name: `${SLICE_BASE_NAME}/session`,
    initialState,
    reducers: {
        signInSuccess(state, action: PayloadAction<string>) {
            state.signedIn = true
            state.token = action.payload
            // ✅ แก้ไข 2: บันทึกลง LocalStorage เมื่อ Login สำเร็จ
            localStorage.setItem('token', action.payload); 
        },
        signOutSuccess(state) {
            state.signedIn = false
            state.token = null
            // ✅ แก้ไข 3: ลบออกจาก LocalStorage เมื่อ Logout
            localStorage.removeItem('token');
        },
    },
})

export const { signInSuccess, signOutSuccess } = sessionSlice.actions
export default sessionSlice.reducer