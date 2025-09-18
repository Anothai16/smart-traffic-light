import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store'
import { socket } from '@/services/socket'
import { HiOutlineRefresh } from 'react-icons/hi'

export type SidePanelContentProps = {
    callBackClose: () => void
}

const SidePanelContent = (props: SidePanelContentProps) => {
    // ดึงข้อมูลผู้ใช้ปัจจุบัน (currentUser) จาก Redux store
    const currentUser = useAppSelector((state) => state.auth.user)
    const [onlineUsers, setOnlineUsers] = useState<any[]>([])

    useEffect(() => {
        // ดักฟัง event 'update_online_users' ที่ถูกส่งมาจาก Server
        socket.on('update_online_users', (users) => {
            setOnlineUsers(users)
        })

        // Cleanup function: ยกเลิกการดักฟัง event เมื่อ Component ถูก Unmount
        return () => {
            socket.off('update_online_users')
        }
    }, [])

    const handleRefresh = () => {
        socket.emit('request_online_users')
    }

    // กรองบัญชีที่ล็อกอินอยู่ออกไปจากรายการ
    const otherOnlineUsers = onlineUsers.filter(
        (user) => user.socketId !== socket.id
    )

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                    Online Users ({onlineUsers.length})
                </h3>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <HiOutlineRefresh className="text-base" />
                    <span>Refresh</span>
                </button>
            </div>
            <div className="flex flex-col gap-4">
                {currentUser.firstName && (
                    <div className="flex items-center gap-2 border-b pb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {currentUser.firstName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">
                                {currentUser.firstName}
                            </p>
                            <p className="text-sm text-gray-500">You</p>
                        </div>
                    </div>
                )}
                <ul className="space-y-4">
                    {otherOnlineUsers.map((user) => (
                        <li key={user.socketId} className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                                    {user.firstName?.charAt(0)}
                                </div>
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {user.firstName}
                                </p>
                                <p className="text-sm text-gray-500">Online</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default SidePanelContent