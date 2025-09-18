import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SLICE_BASE_NAME } from './constants'
import { socket } from '@/services/socket'

export interface SessionState {
    signedIn: boolean
    token: string | null
}

const initialState: SessionState = {
    signedIn: false,
    token: null,
}

const sessionSlice = createSlice({
    name: `${SLICE_BASE_NAME}/session`,
    initialState,
    reducers: {
        signInSuccess(state, action: PayloadAction<string>) {
            state.signedIn = true
            state.token = action.payload
            // เชื่อมต่อกับ Socket.IO เมื่อล็อกอินสำเร็จ
            socket.connect()
        },
        signOutSuccess(state) {
            state.signedIn = false
            state.token = null
            // ตัดการเชื่อมต่อกับ Socket.IO เมื่อล็อกเอาท์
            socket.disconnect()
        },
    },
})

export const { signInSuccess, signOutSuccess } = sessionSlice.actions
export default sessionSlice.reducer