import React, { useEffect, useRef } from 'react'; 
import { socket } from '@/services/socket'; 
import { useAppDispatch, useAppSelector } from '@/store'; 
import { incrementUnreadCount, storeMessage } from '@/store/chat/index'; 
// 🔑 Import notification จาก antd เพื่อใช้ hook
import { notification } from 'antd'; 
import type { RootState } from '@/store';

// Interface ของข้อความ (เหมือนเดิม)
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
    const currentUserEmail = currentUser.email;

    // 🏆 FIX: ใช้ Hook เพื่อสร้าง Notification Context และรับ api instance
    const [api, contextHolder] = notification.useNotification(); 
    
    const activeChatEmail = useAppSelector((state: RootState) => state.chat.activeChatEmail);
    const activeChatEmailRef = useRef(activeChatEmail);

    useEffect(() => {
        activeChatEmailRef.current = activeChatEmail;
    }, [activeChatEmail]);

    useEffect(() => {
        if (!currentUserEmail) return; 

        const handlePrivateMessage = (msg: ChatMessage) => {
            if (msg.senderEmail === currentUserEmail) {
                return; 
            }

            const currentActiveChatEmail = activeChatEmailRef.current;
            const isChatActive = currentActiveChatEmail === msg.senderEmail; 
            
            // A. บันทึกข้อความใน Redux History
            const conversationId = getConversationId(currentUserEmail, msg.senderEmail); 
            dispatch(storeMessage({ conversationId, message: msg })); 
            
            // B. เพิ่ม Badge (เฉพาะเมื่อแชทไม่ได้ถูกเปิดอยู่)
            if (!isChatActive) {
                dispatch(incrementUnreadCount({ senderEmail: msg.senderEmail })); 
            }
            
            // C. แจ้งเตือน Notification (ทุกครั้ง)
            // 🏆 ใช้ api.info จาก hook ที่เสถียร
            api.info({ 
                key: `${msg.timestamp}-${msg.senderEmail}`, 
                message: `ข้อความใหม่จาก ${msg.senderFirstName}`, 
                description: msg.message, 
                duration: 4.5, 
                placement: 'topRight', // 🔑 ตำแหน่งมุมขวาบน
            });
        };

        socket.on('private_message', handlePrivateMessage);

        return () => {
            socket.off('private_message', handlePrivateMessage);
        };
    }, [dispatch, currentUserEmail, api]); 

    // 🔑 FIX: ต้องแสดงผล contextHolder เพื่อให้ Notification แสดงผลบนหน้าจอ
    return (
        <>
            {contextHolder}
            {/* Component นี้จะไม่แสดงผลอื่นใดนอกเหนือจาก contextHolder */}
        </>
    );
};

export default GlobalSocketListener;