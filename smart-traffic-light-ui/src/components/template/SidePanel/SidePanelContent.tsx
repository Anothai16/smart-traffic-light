import React, { useEffect, useState, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store' 
import { resetUnreadCount, storeMessage, setActiveChat } from '@/store/chat/index'; 
import { socket } from '@/services/socket'
import { HiOutlineRefresh, HiOutlineChatAlt } from 'react-icons/hi' 
import { Tag, Space, message } from 'antd'; 

export type SidePanelContentProps = {
    callBackClose: () => void
}

// Interface สำหรับข้อความแชท
interface ChatMessage {
    senderId: string; // Ephemeral Socket ID
    senderFirstName: string;
    senderEmail: string; // 🔑 Stable ID
    receiverId: string; // Ephemeral Socket ID
    receiverEmail: string; // 🔑 Stable ID
    message: string;
    timestamp: number;
}

// Helper: สร้าง Conversation ID ที่คงที่สำหรับผู้สนทนาสองฝ่าย
const getConversationId = (email1: string, email2: string) => {
    return [email1, email2].sort().join('-');
};

const SidePanelContent = (props: SidePanelContentProps) => {
    // States และ Redux Hooks
    const currentUser = useAppSelector((state) => state.auth.user)
    const [onlineUsers, setOnlineUsers] = useState<any[]>([])
    const [chatTarget, setChatTarget] = useState<any>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState<string>('')
    
    // ดึง unreadCounts และ history จาก Redux Store
    const { unreadCounts, history } = useAppSelector((state: any) => state.chat); 
    const dispatch = useAppDispatch(); 
    
    // ID ที่ใช้ในการทำงาน
    const currentUserId = socket.id; 
    const currentUserEmail = currentUser.email; // 🔑 Stable ID ผู้ใช้ปัจจุบัน

    // Auto Scroll Ref และ Logic
    const messagesEndRef = useRef<HTMLDivElement>(null); 
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);
    }
    useEffect(() => {
        scrollToBottom();
    }, [messages]); 
    
    // Effect สำหรับ Socket Listeners ใน Component นี้
    useEffect(() => {
        const updateOnlineUsers = (users: any[]) => {
            if (chatTarget) {
                const reconnectedUser = users.find((u) => u.email === chatTarget.email);
                
                if (reconnectedUser) {
                    setChatTarget(reconnectedUser); 
                } 
            }
            setOnlineUsers(users)
        };

        socket.on('update_online_users', updateOnlineUsers);

        // Local Listener: รับข้อความที่เข้ามาขณะเปิดแชทอยู่
        const handlePrivateMessage = (msg: ChatMessage) => {
            // ตรวจสอบด้วย Stable ID
            if (chatTarget && (msg.senderEmail === chatTarget.email || msg.receiverEmail === chatTarget.email)) {
                setMessages((prev) => {
                    // ป้องกันข้อความซ้ำซ้อนจาก Global Listener
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.timestamp === msg.timestamp && lastMsg.senderEmail === msg.senderEmail) {
                        return prev;
                    }
                    return [...prev, msg]
                })
            }
        };
        socket.on('private_message', handlePrivateMessage);


        return () => {
            socket.off('update_online_users', updateOnlineUsers)
            socket.off('private_message', handlePrivateMessage) 
        }
    }, [chatTarget]) 

    const handleRefresh = () => {
        socket.emit('request_online_users')
    }

    // ฟังก์ชันสำหรับเริ่มแชท (ตั้งค่า activeChat)
    const handleStartChat = (user: any) => {
        if (!currentUserEmail) {
            message.error("Cannot start chat. Your email is not available.");
            return;
        }

        setChatTarget(user)
        
        // 1. ตั้งค่า Active Chat Email ใน Redux
        dispatch(setActiveChat({ email: user.email }));

        // 2. กำหนด ID คู่สนทนา (ใช้ sorted emails)
        const conversationId = getConversationId(currentUserEmail, user.email); 
        
        // 3. โหลดประวัติจาก Redux Store
        const chatHistory = history[conversationId] || [];
        setMessages(chatHistory); 

        // 4. Reset Unread Count (ใช้ email ของคู่สนทนา)
        dispatch(resetUnreadCount({ receiverEmail: user.email })); 
    }
    
    // ฟังก์ชันสำหรับปิดหน้าต่างแชท
    const handleCloseChat = () => {
        setChatTarget(null);
        // ตั้งค่า Active Chat Email เป็น null เมื่อปิดแชท
        dispatch(setActiveChat({ email: null }));
    }


    // ฟังก์ชันส่งข้อความ (บันทึกใน Redux ด้วย Stable ID)
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            inputMessage.trim() === '' || 
            !chatTarget || 
            !currentUserId || 
            !currentUser.firstName ||
            !currentUserEmail ||
            !chatTarget.email
        ) {
            return;
        }

        const messageData: ChatMessage = {
            senderId: currentUserId, 
            senderFirstName: currentUser.firstName, 
            senderEmail: currentUserEmail, // 🔑 Sender Stable ID
            receiverId: chatTarget.socketId,
            receiverEmail: chatTarget.email, // 🔑 Receiver Stable ID
            message: inputMessage,
            timestamp: Date.now(),
        };

        // 1. กำหนด Conversation ID (ใช้ sorted emails)
        const conversationId = getConversationId(currentUserEmail, chatTarget.email); 
        
        // 2. บันทึกข้อความที่เราส่งลงใน Redux History
        dispatch(storeMessage({ conversationId, message: messageData }));
        
        // 3. ส่งผ่าน Socket
        socket.emit('send_private_message', messageData);
        
        // 4. อัปเดต Local State เพื่อแสดงผลทันที
        setMessages((prev) => [...prev, messageData]);
        setInputMessage('');
    }

    const otherOnlineUsers = onlineUsers.filter(
        (user) => user.socketId !== socket.id
    )

// ---

// ส่วนแสดงผลหลัก: หน้าต่างแชท (Chat Window)
if (chatTarget) {
    return (
        <div className="p-4 flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                {/* ปุ่ม Back เรียก handleCloseChat */}
                <button onClick={handleCloseChat} className="text-xl mr-2"> 
                    &larr; 
                </button>
                <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-lg">
                    {chatTarget.firstName?.charAt(0)}
                </div>
                <div>
                    <p className="font-bold text-gray-900">{chatTarget.firstName}</p>
                    <p className={`text-sm ${onlineUsers.some(u => u.socketId === chatTarget.socketId) ? 'text-green-500' : 'text-gray-500'}`}>
                        {onlineUsers.some(u => u.socketId === chatTarget.socketId) ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[calc(100vh-200px)]"> 
                {messages.map((msg, index) => {
                    const isMine = msg.senderEmail === currentUserEmail; 
                    return (
                        <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs p-3 rounded-xl ${isMine ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}>
                                {msg.message}
                                <span className="block text-xs opacity-70 mt-1 text-right">
                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Message ${chatTarget.firstName}...`}
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400" disabled={inputMessage.trim() === ''}>
                    Send
                </button>
            </form>
        </div>
    )
}

// ---

// ส่วนแสดงรายชื่อผู้ใช้ออนไลน์ (Online Users List)
return (
    <div className="p-4">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
                Online Users ({otherOnlineUsers.length})
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
            {/* รายชื่อผู้ใช้ออนไลน์อื่นๆ */}
            <ul className="space-y-4">
                {otherOnlineUsers.map((user) => (
                    <li key={user.socketId} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
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
                        </div>
                        
                        <Space size="middle"> 
                            {/* แสดง Notification Badge โดยอ่านจาก Redux Store ด้วย Email */}
                            {user.email && unreadCounts[user.email] > 0 && (
                                <Tag color="red" className="animate-pulse">
                                    {unreadCounts[user.email]}
                                </Tag>
                            )}
                            
                            {/* ปุ่มเริ่มแชท */}
                            <button 
                                onClick={() => handleStartChat(user)} 
                                className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-gray-100"
                                title={`Start chat with ${user.firstName}`}
                            >
                                <HiOutlineChatAlt className="text-xl" />
                            </button>
                        </Space> 
                    </li>
                ))}
            </ul>
        </div>
    </div>
)
}

export default SidePanelContent