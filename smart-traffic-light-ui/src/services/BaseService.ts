// src/services/BaseService.ts

import axios from 'axios'
import appConfig from '@/configs/app.config'
import { TOKEN_TYPE, REQUEST_HEADER_AUTH_KEY } from '@/constants/api.constant'
import { PERSIST_STORE_NAME } from '@/constants/app.constant'
import deepParseJson from '@/utils/deepParseJson'
import store from '@/store'
import { signOutSuccess } from '@/store/slices/auth/sessionSlice'

const unauthorizedCode = [401]

const BaseService = axios.create({
    timeout: 60000,
    baseURL: appConfig.apiPrefix,
})

BaseService.interceptors.request.use(
    (config) => {
        // พยายามดึง Token จาก LocalStorage (Redux Persist)
        const rawPersistData = localStorage.getItem(PERSIST_STORE_NAME)
        const persistData = deepParseJson(rawPersistData)

        // เช็คความปลอดภัยกัน error กรณี data เป็น null
        let accessToken = (persistData as any)?.auth?.session?.token

        // ถ้าไม่มีใน Storage ให้ลองดึงจาก State ปัจจุบัน
        if (!accessToken) {
            const { auth } = store.getState()
            accessToken = auth.session.token
        }

        if (accessToken) {
            config.headers[REQUEST_HEADER_AUTH_KEY] =
                `${TOKEN_TYPE}${accessToken}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

BaseService.interceptors.response.use(
    (response) => response,
    (error) => {
        // 🟢 ดึง config ออกมาด้วย เพื่อเช็คว่ายิง API เส้นไหนไป
        const { response, config } = error 

        if (response && unauthorizedCode.includes(response.status)) {
            
            // 🟢 [จุดที่แก้ไข] ถ้าเป็น API สำหรับล็อกอิน (เช่น /sign-in) ให้ข้ามการเตะออกไปเลย
            if (config.url?.includes('/sign-in') || config.url?.includes('/login')) {
                return Promise.reject(error)
            }

            // 1. สั่งเคลียร์ State ใน Redux (Logout)
            store.dispatch(signOutSuccess())

            // 2. บังคับเปลี่ยนหน้าไปที่ Login ทันที
            if (window.location.pathname !== '/sign-in-simple' && window.location.pathname !== '/sign-in') {
                window.location.href = '/sign-in' // 🟢 ปรับให้เด้งไปที่หน้า /sign-in พื้นฐาน
            }
        }

        return Promise.reject(error)
    },
)

export default BaseService