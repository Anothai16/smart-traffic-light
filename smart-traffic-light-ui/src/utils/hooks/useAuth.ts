// src/utils/hooks/useAuth.ts 

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
import type { SignInCredential} from '@/@types/auth'

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
                    const user = resp.data.user;

                    // 1. ✅ DECLARED: ประกาศตัวแปร roleName
                    // เราดึงค่าแรกจาก authority ของ Backend มาใช้เป็น Role Name
                    const roleName = (user.authority && user.authority.length > 0) 
                        ? user.authority[0] 
                        : null; 

                    if (roleName) {
                        
                        // 2. FETCH: เรียก API ดึงสิทธิ์ (Permissions Keys)
                        const authoritiesResponse = await fetch(`/api/permissions/${roleName}`);
                        const authoritiesData = await authoritiesResponse.json();
                        
                        // 3. ✅ DECLARED: ประกาศตัวแปร authorities (รายการสิทธิ์ที่ถูกต้อง)
                        let authorities = authoritiesData.authorities || []; // 🔑 เปลี่ยน const เป็น let
                        
                        // 🔑 FIX START: บังคับเพิ่ม 'SuperAdmin' และ 'Admin' เข้าไปในรายการสิทธิ์
                        const lowerCaseRole = roleName.toLowerCase();
                        
                        if (lowerCaseRole.includes('superadmin')) {
                            // 🔑 ใส่ String 'SuperAdmin' เพื่อให้ AccountConfiguration.tsx เห็น
                            if (!authorities.includes('SuperAdmin')) {
                                authorities.push('SuperAdmin');
                            }
                            // ใส่ 'Admin' เผื่อ AccountConfiguration.tsx ต้องการ
                            if (!authorities.includes('Admin')) {
                                authorities.push('Admin');
                            }
                        }
                        // 🔑 FIX END
                        
                        // 4. DISPATCH: บันทึกข้อมูลเข้า Redux State
                        dispatch(
                            setUser({
                                ...user,
                                // FIX: บันทึก Role Name ที่ถูกต้อง
                                Role: roleName, 
                                // FIX: บันทึกรายการสิทธิ์ที่ถูกแก้ไขแล้ว (รวม 'SuperAdmin' แล้ว)
                                authority: authorities, 
                            }),
                        );
                        console.log("User Role and Authorities:", roleName, authorities);
                    } else {
                        // กรณีที่ดึง Role Name ไม่ได้
                        dispatch(setUser(user));
                    }
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

    // const signUp = async (values: SignUpCredential) => {
    //     try {
    //         const resp = await apiSignUp(values)
    //         if (resp.data) {
    //             const { token } = resp.data
    //             dispatch(signInSuccess(token))
    //             if (resp.data.user) {
    //                 dispatch(
    //                     setUser(
    //                         resp.data.user || {
    //                             avatar: '',
    //                             userName: 'Anonymous',
    //                             authority: ['USER'],
    //                             email: '',
    //                         },
    //                     ),
    //                 )
    //             }
    //             const redirectUrl = query.get(REDIRECT_URL_KEY)
    //             navigate(
    //                 redirectUrl
    //                     ? redirectUrl
    //                     : appConfig.authenticatedEntryPath,
    //             )
    //             return {
    //                 status: 'success',
    //                 message: '',
    //             }
    //         }
    //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     } catch (errors: any) {
    //         return {
    //             status: 'failed',
    //             message: errors?.response?.data?.message || errors.toString(),
    //         }
    //     }
    // }

    const handleSignOut = () => {
        dispatch(signOutSuccess())
        dispatch(
            setUser({
                avatar: '',
                userName: '',
                email: '',
                authority: [],
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
        // signUp,
        signOut,
    }
}

export default useAuth;