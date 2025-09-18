import { useEffect } from 'react';
import { useAppSelector } from '@/store';
import { socket } from '@/services/socket';

const useOnlineStatus = () => {
    const signedIn = useAppSelector((state) => state.auth.session.signedIn);
    const currentUser = useAppSelector((state) => state.auth.user);

    useEffect(() => {
        if (signedIn && currentUser.firstName && currentUser.email) {
            // ส่ง email ไปยังเซิร์ฟเวอร์ด้วย
            socket.emit('user_online', {
                socketId: socket.id,
                firstName: currentUser.firstName,
                email: currentUser.email, // เพิ่ม email เข้าไป
            });
        }
    }, [signedIn, currentUser.firstName, currentUser.email]);
};

export default useOnlineStatus;