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
    
    // 🔑 currentUserEmail อาจเป็น string | undefined
    const currentUserEmail = currentUser.email; 

    // 🏆 ใช้ Hook เพื่อสร้าง Notification Context และรับ api instance
    const [api, contextHolder] = notification.useNotification(); 
    
    // 1. ดึง state และสร้าง Ref เพื่อเก็บค่าล่าสุด
    const activeChatEmail = useAppSelector((state: RootState) => state.chat.activeChatEmail);
    const activeChatEmailRef = useRef(activeChatEmail);

    // 🔑 FIX 1: อัปเดต ref ทุกครั้งที่ activeChatEmail เปลี่ยน เพื่อแก้ปัญหา Stale Closure
    useEffect(() => {
        activeChatEmailRef.current = activeChatEmail;
    }, [activeChatEmail]); 

    // 2. Socket Listener
    useEffect(() => {
        // 🔑 FIX 2: Type Guard - ตรวจสอบว่า currentUserEmail มีค่าเป็น string ก่อน
        // ถ้าไม่มีค่า ให้ยกเลิกการตั้งค่า Listener ใน Effect นี้
        if (!currentUserEmail) {
            console.error("Current user email is not available. Chat listener setup skipped.");
            return; 
        }
        
        // ภายใน Block นี้ currentUserEmail จะถูก TypeScript ยอมรับว่าเป็น string แน่นอน

        const handlePrivateMessage = (msg: ChatMessage) => {
            // ดึงค่าล่าสุดจาก Ref
            const currentActiveChatEmail = activeChatEmailRef.current;
            // ตรวจสอบว่ากำลังเปิดแชทกับผู้ส่งข้อความนี้อยู่หรือไม่
            const isChatActive = currentActiveChatEmail === msg.senderEmail; 
            
            // A. บันทึกข้อความใน Redux History (ทำทุกครั้ง)
            // currentUserEmail ปลอดภัยที่จะใช้แล้วเนื่องจากถูก Type Guard ด้านนอก
            const conversationId = getConversationId(currentUserEmail, msg.senderEmail); 
            dispatch(storeMessage({ conversationId, message: msg })); 
            
            // B. เพิ่ม Badge และ C. แจ้งเตือน Notification (เฉพาะเมื่อแชทไม่ได้ถูกเปิดอยู่)
            if (!isChatActive) {
                // B. เพิ่ม Badge: ถ้าไม่ได้เปิดแชทกับคนนี้ ให้เพิ่มจำนวนข้อความที่ยังไม่ได้อ่าน
                dispatch(incrementUnreadCount({ senderEmail: msg.senderEmail })); 
                
                // 🔑 C. แจ้งเตือน Notification: ขึ้นเฉพาะตอนไม่ได้อยู่ในแชท
                api.info({ 
                    key: `${msg.timestamp}-${msg.senderEmail}`, 
                    message: `New massages from ${msg.senderFirstName}`, 
                    description: msg.message, 
                    duration: 3.5, // แสดง 4.5 วินาที
                    placement: 'bottomLeft', 
                });
            }
        };

        socket.on('private_message', handlePrivateMessage);

        return () => {
            socket.off('private_message', handlePrivateMessage);
        };
        // Dependency array: ถูกต้องแล้วเพราะเรา handle undefined ด้วย Type Guard แล้ว
    }, [dispatch, currentUserEmail, api]); 

    // 🔑 ต้องแสดงผล contextHolder เพื่อให้ Notification แสดงผลบนหน้าจอ
    return (
        <>
            {contextHolder}
            {/* Component นี้จะไม่แสดงผลอื่นใดนอกเหนือจาก contextHolder */}
        </>
    );
};

export default GlobalSocketListener;