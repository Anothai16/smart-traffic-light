import { apiSignIn, apiSignOut } from '@/services/AuthService'
import {
    setUser,
    signInSuccess,
    signOutSuccess,
    useAppSelector,
    useAppDispatch,
} from '@/store'
import appConfig from '@/configs/app.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router-dom'
import useQuery from './useQuery'
import type { SignInCredential } from '@/@types/auth'

type Status = 'success' | 'failed'

function useAuth() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const query = useQuery()

    const { token, signedIn } = useAppSelector((state) => state.auth.session)

    const signIn = async (
        values: SignInCredential,
    ): Promise<
        | {
              status: Status
              message: string
          }
        | undefined
    > => {
        try {
            const resp = await apiSignIn(values)
            if (resp.data) {
                const { token } = resp.data
                dispatch(signInSuccess(token))

                if (resp.data.user) {
                    const user = resp.data.user

                    // 1. ดึงชื่อ Role ออกมา (เช่น 'SuperAdmin')
                    const roleName = (user.authority && user.authority.length > 0) 
                        ? user.authority[0] 
                        : 'User';

                    // 2. เตรียมรายการ Authorities (รายการสิทธิ์)
                    // เราสร้างตัวแปรใหม่ขึ้นมาเพื่อรวมสิทธิ์ทั้งหมด
                    let finalAuthorities = [...(user.authority || [])];

                    // 3. 💡 จุดสำคัญที่ทำให้ Role แสดงผลและ Authority ทำงานเหมือนเดิม:
                    // ถ้าเป็น SuperAdmin เราต้องมั่นใจว่ามี String 'SuperAdmin' อยู่ในลิสต์ด้วย
                    // เพื่อให้ไฟล์ navigationConfig.ts และหน้าเว็บเห็นสิทธิ์นี้
                    if (roleName.toLowerCase().includes('superadmin')) {
                        if (!finalAuthorities.includes('SuperAdmin')) {
                            finalAuthorities.push('SuperAdmin');
                        }
                        if (!finalAuthorities.includes('Admin')) {
                            finalAuthorities.push('Admin');
                        }
                    }

                    dispatch(
                        setUser({
                            ...user,
                            Role: roleName,        // เก็บไว้โชว์ชื่อตำแหน่งบนหน้าเว็บ
                            authority: finalAuthorities, // เก็บรายการสิทธิ์ที่รวมชื่อ Role แล้ว
                        }),
                    )

                    console.log("Login Success - Role:", roleName, "Final Authorities:", finalAuthorities)
                }

                const redirectUrl = query.get(REDIRECT_URL_KEY)
                navigate(
                    redirectUrl
                        ? redirectUrl
                        : appConfig.authenticatedEntryPath,
                )
                return {
                    status: 'success',
                    message: '',
                }
            }
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const handleSignOut = () => {
        dispatch(signOutSuccess())
        dispatch(
            setUser({
                avatar: '',
                userName: '',
                email: '',
                authority: [],
                Role: ''
            }),
        )
        navigate(appConfig.unAuthenticatedEntryPath)
    }

    const signOut = async () => {
        await apiSignOut()
        handleSignOut()
    }

    return {
        authenticated: token && signedIn,
        signIn,
        signOut,
    }
}

export default useAuth