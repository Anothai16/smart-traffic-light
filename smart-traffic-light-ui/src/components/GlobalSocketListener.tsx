import React, { useEffect, useRef } from 'react'; 
import { socket } from '@/services/socket'; 
import { useAppDispatch, useAppSelector } from '@/store'; 
import { incrementUnreadCount, storeMessage } from '@/store/chat/index'; 
import { notification } from 'antd'; 
import type { RootState } from '@/store';

// Interface และ Helper Functions (เหมือนเดิม)
interface ChatMessage {
    senderId: string; 
    senderFirstName: string;
    senderEmail: string; 
    receiverId: string; 
    receiverEmail: string; 
    message: string;
    timestamp: number;
}
const getConversationId = (email1: string, email2: string) => {
    return [email1, email2].sort().join('-');
};

const GlobalSocketListener = () => {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state: RootState) => state.auth.user); 
    
    // ดึงค่าทั้งหมด (อาจเป็น null, undefined, หรือ "")
    const currentUserEmail = currentUser?.email; 
    const currentUserFirstName = currentUser?.firstName; // ต้องดึงมาด้วย

    const [api, contextHolder] = notification.useNotification(); 
    
    const activeChatEmail = useAppSelector((state: RootState) => state.chat.activeChatEmail);
    const activeChatEmailRef = useRef(activeChatEmail);

    useEffect(() => {
        activeChatEmailRef.current = activeChatEmail;
    }, [activeChatEmail]); 

    // =========================================================================
    // 🏆 useEffect 1: จัดการการเชื่อมต่อใหม่ (Re-registration Logic)
    // =========================================================================
    useEffect(() => {
        // 🔑 Type Guard 1: ตรวจสอบว่าข้อมูลผู้ใช้จำเป็นต้องมีค่าเป็น string ที่ไม่ว่างเปล่า
        if (!currentUserEmail || currentUserEmail.length === 0 || !currentUserFirstName) {
            // console.log("CLIENT LOG (Re-reg): User data is not available/valid. Skipping Re-registration setup.");
            return;
        }

        const handleConnect = () => {
            // console.log(`CLIENT LOG (Re-reg): Event 'connect' fired. Socket ID is ${socket.id}`);
            
            // ส่ง Event 'user_online' เพื่อลงทะเบียนสถานะออนไลน์ใหม่ทุกครั้ง
            socket.emit('user_online', {
                email: currentUserEmail,
                firstName: currentUserFirstName,
            });
            // console.log(`CLIENT LOG (Re-reg): Sent 'user_online' event for ${currentUserEmail}.`);
        };

        // ดักฟัง 'connect' event (ถูกเรียกเมื่อเชื่อมต่อครั้งแรกและ reconnect)
        socket.on('connect', handleConnect);
        
        // ถ้า Component Mount ขึ้นมาพร้อมกับ Socket ที่ต่ออยู่แล้ว ให้ลงทะเบียนทันที
        if (socket.connected) {
            //  console.log("CLIENT LOG (Re-reg): Socket already connected on mount. Attempting immediate re-register.");
             handleConnect();
        }

        return () => {
            socket.off('connect', handleConnect);
            // console.log("CLIENT LOG (Re-reg): Cleaned up 'connect' listener.");
        };
        
    }, [currentUserEmail, currentUserFirstName]); 

    // =========================================================================
    // 🥈 useEffect 2: จัดการข้อความส่วนตัว (Private Message Listener)
    // =========================================================================
    useEffect(() => {
        // 🔑 Type Guard 2: ตรวจสอบว่า currentUserEmail มีค่าเป็น string ก่อนตั้งค่า Listener
        if (!currentUserEmail || currentUserEmail.length === 0) {
            // console.log("CLIENT LOG (PM Listener): Current user email is not available. Chat listener setup skipped.");
            return; 
        }

        const handlePrivateMessage = (msg: ChatMessage) => {
            const currentActiveChatEmail = activeChatEmailRef.current;
            const isChatActive = currentActiveChatEmail === msg.senderEmail; 
            
            // A. บันทึกข้อความใน Redux History
            const conversationId = getConversationId(currentUserEmail, msg.senderEmail); 
            dispatch(storeMessage({ conversationId, message: msg })); 
            
            // B. เพิ่ม Badge และ C. แจ้งเตือน Notification
            if (!isChatActive) {
                dispatch(incrementUnreadCount({ senderEmail: msg.senderEmail })); 
                api.info({ 
                    key: `${msg.timestamp}-${msg.senderEmail}`, 
                    message: `New messages from ${msg.senderFirstName}`, 
                    description: msg.message, 
                    duration: 3.5, 
                    placement: 'bottomLeft', 
                });
            }
        };

        socket.on('private_message', handlePrivateMessage);

        return () => {
            socket.off('private_message', handlePrivateMessage);
        };
    }, [dispatch, currentUserEmail, api]); 


    return (
        <>
            {contextHolder}
        </>
    );
};

export default GlobalSocketListener;